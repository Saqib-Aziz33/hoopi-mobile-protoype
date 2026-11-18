const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(require.resolve('../src/lib/dictation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', code)(exportsObject);
const { Dictation } = exportsObject;
function fixture(overrides = {}) {
  const listeners = new Map(); const texts = []; const statuses = []; const errors = []; const starts = []; const calls = [];
  const engine = {
    isRecognitionAvailable: () => true,
    requestPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
    start: options => { starts.push(options); calls.push('start'); emit('start', null); },
    stop: () => calls.push('stop'), abort: () => calls.push('abort'),
    addListener: (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); return { remove: () => listeners.get(name).delete(fn) }; },
    ...overrides,
  };
  function emit(name, event) { for (const callback of [...(listeners.get(name) ?? [])]) callback(event); }
  const controller = new Dictation(engine, text => texts.push(text), state => statuses.push(state), error => errors.push(error), async () => { calls.push('stop-reading'); }, 'Rebuild needed');
  return { controller, texts, statuses, errors, starts, calls, listeners, emit };
}
const result = (transcript, isFinal = false) => ({ results: [{ transcript }], isFinal });

test('dictation preserves the typed draft and replaces interim text without duplication', async () => {
  const f = fixture();
  await f.controller.start('Please write', 'en-US');
  f.emit('result', result('a'));
  f.emit('result', result('a short message'));
  f.emit('result', result('a short message.', true));
  f.emit('end', null);
  assert.deepEqual(f.texts, ['Please write a', 'Please write a short message', 'Please write a short message.']);
  assert.equal(f.controller.status, 'idle');
  assert.deepEqual(f.calls, ['stop-reading', 'start']);
  assert.equal(f.starts[0].continuous, false);
  assert.equal(f.starts[0].recordingOptions.persist, false);
});
test('stop waits for the native final transcript before returning to idle', async () => {
  const f = fixture();
  await f.controller.start('', 'en-US');
  f.controller.stop();
  assert.equal(f.controller.status, 'finishing');
  f.emit('result', result('Final words', true)); f.emit('end', null);
  assert.equal(f.texts.at(-1), 'Final words');
  assert.equal(f.controller.status, 'idle');
});
test('navigating away while permissions are pending prevents a late microphone start', async () => {
  let grant;
  const f = fixture({ requestPermissionsAsync: () => new Promise(resolve => { grant = resolve; }) });
  const pending = f.controller.start('Draft', 'en-US');
  await Promise.resolve();
  f.controller.cancel();
  grant({ granted: true, canAskAgain: true }); await pending;
  assert.equal(f.starts.length, 0);
  assert.equal(f.controller.status, 'idle');
});
test('late results after cancel cannot overwrite a new draft', async () => {
  const f = fixture(); await f.controller.start('Original', 'en-US');
  const lateResult = [...f.listeners.get('result')][0];
  f.controller.cancel();
  lateResult(result('Old speech', true));
  assert.equal(f.texts.length, 0);
  assert.ok(f.calls.includes('abort'));
  assert.ok([...f.listeners.values()].every(callbacks => callbacks.size === 0));
});
test('denied permission offers settings without altering the draft or starting audio', async () => {
  const f = fixture({ requestPermissionsAsync: async () => ({ granted: false, canAskAgain: false }) });
  await f.controller.start('Keep this draft', 'en-US');
  assert.equal(f.starts.length, 0);
  assert.equal(f.texts.length, 0);
  assert.equal(f.errors.at(-1).settings, true);
});
test('recognition errors end the session and preserve any text already recognized', async () => {
  const f = fixture(); await f.controller.start('Draft', 'en-US');
  f.emit('result', result('with words'));
  f.emit('error', { error: 'network', message: 'Failure' });
  assert.equal(f.controller.status, 'idle');
  assert.equal(f.texts.at(-1), 'Draft with words');
  assert.match(f.errors.at(-1).message, /connection/);
});
test('an unavailable native module fails gracefully without throwing', async () => {
  const errors = [];
  const controller = new Dictation(null, () => assert.fail('must not edit'), () => {}, error => errors.push(error), async () => {}, 'Rebuild needed');
  await controller.start('draft', 'en-US');
  assert.equal(controller.status, 'idle');
  assert.equal(errors.at(-1).message, 'Rebuild needed');
});
