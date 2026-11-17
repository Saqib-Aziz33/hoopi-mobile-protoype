const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../src/lib/chat-session.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);
const { ChatSession } = exportsObject;

test('new chat resets both identifiers and creates a separate server history entry', () => {
  let next = 0;
  const session = new ChatSession(() => String(++next));
  // Mirrors the backend contract: resolve an explicit ID, otherwise find/create by thread.
  const history = new Map();
  const send = () => {
    const request = session.request('Hello', 'chat');
    const id = request.conversation_id ?? history.get(request.thread_key) ?? `conversation-${history.size + 1}`;
    history.set(request.thread_key, id);
    session.accept({ type: 'done', thread_key: request.thread_key, conversation_id: id });
    return { request, id };
  };
  const first = send();
  assert.equal(send().id, first.id);
  session.reset();
  const second = send();
  assert.notEqual(second.request.thread_key, first.request.thread_key);
  assert.equal(second.request.conversation_id, undefined);
  assert.notEqual(second.id, first.id);
  assert.equal(history.size, 2);
});

test('follow-ups and retries reuse a key before the completion event arrives', () => {
  const session = new ChatSession(() => 'fresh-id');
  const first = session.request('First prompt', 'work');
  assert.equal(first.thread_key, 'thread-fresh-id');
  assert.equal(session.request('Retry after a dropped connection', 'work').thread_key, first.thread_key);
});

test('server identifiers are kept for following messages', () => {
  const session = new ChatSession(() => 'fresh-id');
  session.request('Hello', 'chat');
  session.accept({ type: 'done', thread_key: '7:thread-fresh-id', conversation_id: 'public-id' });
  assert.deepEqual(session.request('Tell me more', 'chat'), { message: 'Tell me more', mode: 'chat', thread_key: '7:thread-fresh-id', conversation_id: 'public-id' });
});

test('opening history restores its thread, including an old default-thread conversation', () => {
  const session = new ChatSession(() => 'new-id');
  session.restore({ id: 'saved-chat', thread_key: '7:default' });
  const resumed = session.request('Continue this chat', 'chat');
  assert.equal(resumed.conversation_id, 'saved-chat');
  assert.equal(resumed.thread_key, '7:default');
  session.reset();
  assert.equal(session.request('Start another chat', 'chat').thread_key, 'thread-new-id');
});

test('restarting the session allocates a fresh key rather than the account default', () => {
  let next = 0;
  const createId = () => String(++next);
  const beforeRestart = new ChatSession(createId).request('Hello', 'chat');
  const afterRestart = new ChatSession(createId).request('Hello again', 'chat');
  assert.notEqual(beforeRestart.thread_key, afterRestart.thread_key);
  assert.equal(afterRestart.conversation_id, undefined);
});

test('empty chats allocate nothing and incomplete stream events do not clear identity', () => {
  let allocations = 0;
  const session = new ChatSession(() => String(++allocations));
  session.reset();
  session.reset();
  assert.equal(allocations, 0);
  session.restore({ id: 'saved', thread_key: '7:saved-thread' });
  session.accept({ type: 'token', content: 'hello' });
  session.accept({ type: 'done', thread_key: '', conversation_id: null });
  assert.equal(session.request('Continue', 'chat').conversation_id, 'saved');
  assert.equal(allocations, 0);
});
