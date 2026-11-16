const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../src/lib/event-stream.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);
const { EventStreamDecoder } = exportsObject;

test('preserves JSON split across network chunks and CRLF boundaries', () => {
  const events = [];
  const decoder = new EventStreamDecoder(event => events.push(event));
  decoder.push('data: {"type":"token","content":"hel');
  decoder.push('lo"}\r');
  decoder.push('\n\r\n');
  assert.deepEqual(events, [{ type: 'token', content: 'hello' }]);
});

test('dispatches the final event even without a trailing newline', () => {
  const events = [];
  const decoder = new EventStreamDecoder(event => events.push(event));
  decoder.push('data: {"type":"done","conversation_id":"abc"}', true);
  assert.deepEqual(events, [{ type: 'done', conversation_id: 'abc' }]);
});

test('joins multiline data, ignores comments and malformed events, then recovers', () => {
  const events = [];
  const decoder = new EventStreamDecoder(event => events.push(event));
  decoder.push(': ping\n\ndata: invalid\n\ndata:{"type":\ndata: "done"}\n\n');
  assert.deepEqual(events, [{ type: 'done' }]);
});

test('does not swallow errors thrown by the event consumer', () => {
  const decoder = new EventStreamDecoder(() => { throw new Error('consumer failed'); });
  assert.throws(() => decoder.push('data: {}\n\n'), /consumer failed/);
});
