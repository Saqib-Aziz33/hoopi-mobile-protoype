const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const result = {};
  new Function('require', 'exports', '__DEV__', code)(id => Object.hasOwn(dependencies, id) ? dependencies[id] : require(id), result, true);
  return result;
}
const mode = load('voice-mode');
const { VoiceMode, VoicePermissionError } = mode;
const { createVapiCall, VAPI_ORIGIN } = load('vapi-call');
const session = { token: 'test-session-token', assistantId: 'workspace-assistant', expiresAt: new Date(Date.now() + 60000).toISOString() };
const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(overrides = {}, timeout = 500) {
  const runs = []; const states = []; const requests = [];
  const voice = new VoiceMode({
    prepare: async () => {}, beforeStart: async () => {},
    session: async signal => { requests.push(signal); return session; },
    transport: emit => { const run = { emit, start: async () => { emit({ type: 'ready' }); }, setMuted: muted => { run.muted = muted; }, stop: async () => { run.stopped = true; } }; runs.push(run); return run; },
    ...overrides,
  }, state => states.push(state), timeout);
  return { voice, runs, states, requests };
}

test('live voice follows user and assistant turns and controls the native microphone', async () => {
  const { voice, runs, requests } = fixture();
  await voice.start();
  assert.equal(voice.state.status, 'listening');
  runs[0].emit({ type: 'message', message: { type: 'transcript', role: 'user', transcriptType: 'partial', transcript: 'Plan' } });
  runs[0].emit({ type: 'message', message: { type: 'transcript', role: 'user', transcriptType: 'final', transcript: 'Plan my day' } });
  assert.equal(voice.state.heard, 'Plan my day'); assert.equal(voice.state.status, 'thinking');
  runs[0].emit({ type: 'speaking' });
  runs[0].emit({ type: 'message', message: { type: 'transcript', role: 'assistant', transcript: 'Let’s start with your calendar.' } });
  assert.equal(voice.state.status, 'speaking'); assert.match(voice.state.answer, /calendar/);
  voice.toggleMuted(); assert.equal(runs[0].muted, true); assert.equal(voice.state.muted, true);
  runs[0].emit({ type: 'listening' });
  runs[0].emit({ type: 'message', message: { type: 'transcript', role: 'user', transcriptType: 'final', transcript: 'And tomorrow?' } });
  assert.equal(voice.state.answer, '');
  await voice.stop(); assert.equal(runs[0].stopped, true); assert.equal(requests[0].aborted, true); assert.equal(voice.state.status, 'idle');
});
test('canceling a permission prompt never requests a backend session after a late grant', async () => {
  const permission = deferred(); const { voice, requests, runs } = fixture({ prepare: () => permission.promise });
  const starting = voice.start(); await tick(); await voice.stop(); permission.resolve(); await starting;
  assert.equal(requests.length, 0); assert.equal(runs.length, 0); assert.equal(voice.state.status, 'idle');
});
test('denied permission offers Settings and does not provision a call', async () => {
  const { voice, requests } = fixture({ prepare: async () => { throw new VoicePermissionError(true); } });
  await voice.start(); assert.equal(voice.state.error.settings, true); assert.equal(requests.length, 0);
});
test('a canceled workspace session cannot connect after its request completes', async () => {
  const result = deferred(); let signal;
  const { voice, runs } = fixture({ session: value => { signal = value; return result.promise; } });
  const starting = voice.start(); await tick(); await voice.stop(); result.resolve(session); await starting;
  assert.equal(signal.aborted, true); assert.equal(runs.length, 0); assert.equal(voice.state.status, 'idle');
});
test('rapid taps allocate one call and stale events cannot change a later call', async () => {
  const { voice, runs } = fixture();
  await Promise.all([voice.start(), voice.start()]); assert.equal(runs.length, 1);
  await voice.stop(); await voice.start();
  runs[0].emit({ type: 'ended' }); runs[0].emit({ type: 'error', error: { message: 'old failure' } });
  runs[0].emit({ type: 'message', message: { type: 'transcript', role: 'user', transcript: 'old question' } });
  assert.equal(voice.state.status, 'listening'); assert.equal(voice.state.heard, ''); assert.equal(voice.state.error, null);
  await voice.stop();
});
test('teardown finishes before another native call object is created', async () => {
  const closing = deferred(); const { voice, runs } = fixture(); await voice.start();
  runs[0].stop = () => closing.promise;
  const stopping = voice.stop(); await voice.start(); assert.equal(runs.length, 1); assert.equal(voice.state.status, 'ending');
  closing.resolve(); await stopping; await voice.start(); assert.equal(runs.length, 2); await voice.stop();
});
test('failed native teardown blocks reconnecting until the app restarts', async () => {
  const { voice, runs } = fixture(); await voice.start();
  runs[0].stop = async () => { throw new Error('native shutdown failed'); };
  await voice.stop(); await voice.start();
  assert.equal(runs.length, 1); assert.equal(voice.state.status, 'idle'); assert.match(voice.state.error.message, /Restart the app/);
});
test('remote call-end, errors and a connection timeout close resources', async () => {
  for (const event of [{ type: 'ended' }, { type: 'message', message: { type: 'status-update', status: 'ended' } }, { type: 'error', error: { message: 'Lost connection' } }]) {
    const { voice, runs } = fixture(); await voice.start(); runs[0].emit(event); await tick();
    assert.equal(runs[0].stopped, true); assert.equal(voice.state.status, 'idle');
  }
  const { voice, requests } = fixture({ session: () => new Promise(() => {}) }, 10);
  void voice.start(); await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(voice.state.status, 'idle'); assert.match(voice.state.error.message, /too long/); assert.equal(requests.length, 0);
});
test('expired sessions never reach the provider', async () => {
  const { voice, runs } = fixture({ session: async () => ({ ...session, expiresAt: '2000-01-01T00:00:00Z' }) });
  await voice.start(); assert.equal(runs.length, 0); assert.match(voice.state.error.message, /expired/);
});
test('provider handshake uses only the scoped assistant and consistent Origin', async () => {
  let request;
  const signal = new AbortController().signal;
  const url = await createVapiCall(session, signal, async (...args) => { request = args; return { ok: true, json: async () => ({ webCallUrl: 'https://hoopi.daily.co/test-room' }) }; });
  assert.equal(url, 'https://hoopi.daily.co/test-room'); assert.equal(request[0], 'https://api.vapi.ai/call/web');
  assert.equal(request[1].headers.Origin, VAPI_ORIGIN); assert.equal(request[1].headers.Authorization, `Bearer ${session.token}`);
  assert.deepEqual(JSON.parse(request[1].body), { assistantId: session.assistantId }); assert.equal(request[1].signal, signal);
});
test('provider failures never display secret response bodies and invalid room URLs are rejected', async () => {
  const signal = new AbortController().signal;
  await assert.rejects(createVapiCall(session, signal, async () => ({ ok: false, status: 403, json: async () => ({ error: session.token }) })), error => /denied/.test(error.message) && !error.message.includes(session.token));
  for (const webCallUrl of ['http://hoopi.daily.co/room', 'https://daily.co.evil.com/room', 'https://user:password@hoopi.daily.co/room']) {
    await assert.rejects(createVapiCall(session, signal, async () => ({ ok: true, json: async () => ({ webCallUrl }) })));
  }
});

function nativeFixture({ permission = { granted: true }, modules = { WebRTCModule: {}, DailyNativeUtils: {}, RNBackgroundTimer: {} }, callUrl } = {}) {
  const events = new Map(); const created = []; const changes = [];
  const call = {
    on: (event, listener) => events.set(event, listener), off: (event, listener) => { assert.equal(events.get(event), listener); events.delete(event); },
    setNativeInCallAudioMode: value => changes.push(['audioMode', value]), join: async options => changes.push(['join', options]),
    startRemoteParticipantsAudioLevelObserver: async () => {}, updateParticipant: (...args) => changes.push(['subscribe', ...args]),
    sendAppMessage: value => changes.push(['control', value]), setLocalAudio: value => changes.push(['mic', value]), destroy: async () => changes.push(['destroy']),
  };
  const native = load('voice-native.native', {
    'react-native': { NativeModules: modules, Platform: { OS: 'android' } },
    'expo-audio': { requestRecordingPermissionsAsync: async () => permission },
    '@daily-co/react-native-daily-js': { __esModule: true, default: { createCallObject: options => { created.push(options); return call; } } },
    './voice-mode': mode, './vapi-call': { createVapiCall: callUrl ?? (async () => 'https://hoopi.daily.co/test-room') },
  });
  return { native, call, events, created, changes };
}
test('native transport is audio-only, subscribes to the assistant and sends Vapi’s playable handshake', async () => {
  const { native, created, events, changes } = nativeFixture(); const received = [];
  await native.prepareNativeVoice(); const transport = new native.NativeVoiceTransport(event => received.push(event));
  await transport.start(session, new AbortController().signal);
  assert.deepEqual(created, [{ audioSource: true, videoSource: false }]); assert.ok(changes.some(item => item[0] === 'audioMode' && item[1] === 'video'));
  events.get('participant-joined')({ participant: { local: false, session_id: 'assistant' } });
  assert.deepEqual(changes.find(item => item[0] === 'subscribe'), ['subscribe', 'assistant', { setSubscribedTracks: { audio: true, video: false } }]);
  events.get('track-started')({ track: { kind: 'audio' }, participant: { local: false, user_name: 'Vapi Speaker' } });
  assert.ok(changes.some(item => item[0] === 'control' && item[1] === 'playable'));
  const late = events.get('app-message'); late({ data: 'listening' }); late({ data: JSON.stringify({ type: 'transcript', role: 'assistant', transcript: 'Hi' }) });
  assert.deepEqual(received.map(event => event.type), ['ready', 'message']);
  await transport.stop(); assert.equal(events.size, 0); assert.deepEqual(changes.slice(-2), [['mic', false], ['destroy']]);
  late({ data: 'listening' }); assert.equal(received.length, 2);
});
test('native cancellation during the provider request never opens a microphone', async () => {
  const pending = deferred(); const { native, created } = nativeFixture({ callUrl: () => pending.promise });
  await native.prepareNativeVoice(); const transport = new native.NativeVoiceTransport(() => {});
  const start = transport.start(session, new AbortController().signal); await transport.stop(); pending.resolve('https://hoopi.daily.co/test-room'); await start;
  assert.equal(created.length, 0);
});
test('native cancellation during join destroys the call and ignores late ready events', async () => {
  const joining = deferred(); const { native, call, changes, events } = nativeFixture(); const received = [];
  call.join = () => joining.promise;
  await native.prepareNativeVoice(); const transport = new native.NativeVoiceTransport(event => received.push(event));
  const start = transport.start(session, new AbortController().signal); await tick();
  const lateReady = events.get('joined-meeting'); await transport.stop(); lateReady(); joining.resolve(); await start;
  assert.equal(received.length, 0); assert.deepEqual(changes.slice(-2), [['mic', false], ['destroy']]);
});
test('native destruction still runs when muting during shutdown throws', async () => {
  const { native, call, changes } = nativeFixture();
  await native.prepareNativeVoice(); const transport = new native.NativeVoiceTransport(() => {});
  await transport.start(session, new AbortController().signal);
  call.setLocalAudio = () => { throw new Error('microphone already unavailable'); };
  await assert.rejects(transport.stop()); assert.deepEqual(changes.at(-1), ['destroy']);
});
test('Expo Go and denied native permissions fail before loading the SDK', async () => {
  await assert.rejects(nativeFixture({ modules: {} }).native.prepareNativeVoice(), /new development build or APK/);
  await assert.rejects(nativeFixture({ permission: { granted: false, canAskAgain: false } }).native.prepareNativeVoice(), error => error instanceof VoicePermissionError && error.settings);
});
