const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const result = {};
  new Function('require', 'exports', code)(id => dependencies[id] ?? require(id), result);
  return result;
}
// Use the renderer's actual Markdown parser without importing its native UI module into Node.
const text = load('speech-text', { 'react-native-markdown-display': { MarkdownIt: require('markdown-it') } });
const { ReadAloud } = load('read-aloud', { './speech-text': text });

test('reads formatted text and link labels without Markdown syntax or link URLs', () => {
  assert.equal(text.speechText('# Update\n\n**Ready** and [read more](https://example.com/private).'), 'Update\nReady and read more.');
});
test('speech chunks respect native limits and do not split emoji surrogate pairs', () => {
  const source = 'Hello 🙂 this is a longer response with more than one chunk.';
  const chunks = text.speechChunks(source, 12);
  assert.ok(chunks.every(chunk => chunk.length <= 12));
  assert.equal(chunks.join(' '), source);
  for (const chunk of text.speechChunks('a🙂a🙂a🙂', 2)) assert.ok(!/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(chunk));
});
function fixture(stop = async () => {}) {
  const spoken = []; const changes = []; const errors = [];
  const reader = new ReadAloud({ maxSpeechInputLength: 12, stop, speak: (value, callbacks) => spoken.push({ value, callbacks }) }, id => changes.push(id), error => errors.push(error));
  return { reader, spoken, changes, errors };
}
test('long replies advance only on completion and finish reading after the last chunk', async () => {
  const { reader, spoken, changes } = fixture();
  await reader.toggle('one', 'First words. More words. Last words.');
  assert.equal(spoken.length, 1);
  let index = 0;
  while (index < spoken.length) spoken[index++].callbacks.onDone();
  assert.ok(spoken.length > 1);
  assert.equal(changes.at(-1), null);
});
test('switching messages ignores callbacks from the previous message', async () => {
  const { reader, spoken, changes } = fixture();
  await reader.toggle('one', 'First reply');
  await reader.toggle('two', 'Second reply');
  spoken[0].callbacks.onDone(); spoken[0].callbacks.onStopped();
  assert.equal(changes.at(-1), 'two');
  assert.equal(spoken.length, 2);
});
test('a second tap cancels a pending start and never speaks after stop', async () => {
  let release;
  const { reader, spoken, changes } = fixture(() => new Promise(resolve => { release = resolve; }));
  const start = reader.toggle('one', 'Hello');
  const firstStop = release;
  const stop = reader.toggle('one', 'Hello');
  firstStop(); await start;
  release(); await stop;
  assert.equal(spoken.length, 0);
  assert.equal(changes.at(-1), null);
});
test('a native error ends the session and prevents a late completion from speaking more', async () => {
  const { reader, spoken, changes, errors } = fixture();
  await reader.toggle('one', 'First words and more words');
  spoken[0].callbacks.onError(new Error('Unavailable'));
  spoken[0].callbacks.onDone();
  assert.equal(spoken.length, 1);
  assert.equal(changes.at(-1), null);
  assert.equal(errors.length, 1);
});
