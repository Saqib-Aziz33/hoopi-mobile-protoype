# Live voice mode

Tap the **audio-lines icon** at the bottom right of the composer, between the dictation microphone and Send, allow microphone access, and speak. Its icon and placement match the web composer. Hoopi replies aloud automatically. The call screen shows the latest question and answer, listening/thinking/speaking states, Mute, and End call. Speech can interrupt the assistant, using the workspace assistant's Vapi configuration. An animated crest uses the existing logo colors and respects reduced motion.

Voice mode is separate from the composer's microphone, which dictates a draft, and the Read aloud action on a completed text reply. Starting a call cancels dictation and read-aloud playback. Ending a call restores the text conversation and draft. As in the reference frontend, live transcripts are not added to recent text-chat history.

## Backend and feature availability

The implementation follows the latest reference `web/src/hooks/use-vapi-voice.ts` and `web/src/lib/api/voice.ts`, checked against frontend `origin/main` on 18 November 2026. Their voice implementation matched the local reference at that time.

- `GET https://api.hoopi.ai/api/v1/settings/public`: the Voice button appears only when `features.voice === true`. Failed settings requests hide it. Returning to the screen refreshes this setting.
- `POST https://api.hoopi.ai/api/v1/voice/session`: uses the existing bearer authentication and `X-Workspace-Id` header. The backend checks active workspace membership, feature availability and provisioning, then returns `{ token, assistantId, expiresAt }`.
- The backend chooses the workspace assistant and signs a short-lived Vapi public token restricted to that assistant. The mobile client never needs a Vapi private/public API key in its environment or build config.
- The native client explicitly sends the same `Origin: https://api.hoopi.ai` on session creation and the Vapi call request. This matches the backend's Origin-bound token restrictions; native fetch has no implicit browser Origin.
- `POST https://api.vapi.ai/call/web` creates a call using that scoped token and assistant ID. The client joins the returned Daily room with native WebRTC, microphone on, camera off, and remote audio subscriptions. The workspace assistant sends its Custom LLM requests to Hoopi's existing voice backend.

The platform administrator must enable voice and configure the server's Vapi integration. A disabled feature stays hidden; unavailable server configuration or denied provider access produces an error. Session creation happens only after a person taps Voice and grants microphone access. Tokens are kept only in memory, never persisted or logged. Live microphone audio goes to the configured voice service; the app does not save an audio recording.

## Native dependencies and build

Voice mode uses `@daily-co/react-native-daily-js` 0.90.0 and its matching `@daily-co/react-native-webrtc` 155.0.1-daily.1 peer, with AsyncStorage, background-timer and get-random-values peers. `expo-audio` requests microphone permission only; it does not run a second recorder or control the call's audio session.

The published `@vapi-ai/react-native` 0.3.0 SDK pins an older Daily/WebRTC stack and documents disabling the New Architecture. Expo SDK 58 cannot disable it. The app instead implements the SDK's small public Vapi call/message protocol over the current Daily native transport. This is an actual WebRTC conversation, not a WebView or a dictation/read-aloud loop.

The published Daily Expo config plugin 0.0.13 also excludes SDK 58 in its peer range. `plugins/with-voice-audio.js` adapts its audio-only configuration to Expo's current config-plugin API: microphone usage, audio/network permissions, the microphone foreground-service declaration, and native library packaging. It enables no camera or screen-sharing capability. Do not create or edit generated native directories manually. Check this adapter and the Vapi handshake when upgrading either SDK.

Expo Go does not contain these native modules. A JavaScript reload or OTA update cannot add them. Install a new APK:

```bash
npm install
npx eas-cli@latest build --platform android --profile preview
```

For a development client, first install `expo-dev-client` using `npx expo install expo-dev-client`, then use the existing EAS development profile. See [APK builds](android-apk-build.md). iOS also needs a new native build.

### Android release build: missing AV1 decoder interface

WebRTC 155's Android artifact contains `Dav1dDecoderJni` with a reference to `org.webrtc.Dav1dDecoder$Natives`, but does not ship that interface or the `Dav1dDecoder` class. The dangling JNI bridge is not referenced by the other Java classes. R8 still reports it during `:app:minifyReleaseWithR8` because WebRTC's consumer rules keep its package.

`app.json` configures the SDK-compatible `expo-build-properties` plugin to append this precise rule during prebuild:

```proguard
-dontwarn org.webrtc.Dav1dDecoder$Natives
```

This covers the unused video-decoder reference while keeping release optimization and all other missing-class checks enabled. Hoopi's voice transport remains audio-only. Do not add a blanket `-dontwarn org.webrtc.**`, disable R8, or edit generated native files to work around this error. Revisit the rule when upgrading WebRTC.

After installing the updated dependencies, retry the cloud build:

```bash
npm install
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

The missing reference was verified in both `org.jitsi:webrtc` 155.0.0 and 155.0.1 Android artifacts from [Maven Central](https://repo.maven.apache.org/maven2/org/jitsi/webrtc/). See [Expo's extraProguardRules option](https://docs.expo.dev/versions/v58.0.0/sdk/build-properties/#pluginconfigtypeandroid) for the generated configuration.

The fix was checked with a fresh Android prebuild in a temporary directory: the generated `android/app/proguard-rules.pro` contains the exact rule once, and the release Gradle configuration includes that file. TypeScript, lint and all 39 regression tests also pass. A new cloud release build is still needed to verify APK generation.

## Lifecycle and failure handling

Calls end when you tap End call, navigate away, start a new chat, switch workspace, or background the app. Android Back ends the call and returns to the text chat before normal navigation resumes. Temporary iOS inactivity during a microphone permission prompt is allowed. Incoming interruptions after connection stop the call. Calls do not resume automatically.

Canceled permission grants, API responses, native events, and connection errors cannot revive an old call. Pending fetches are aborted. A 45-second connection timeout covers the backend and provider handshake. Teardown mutes the microphone, removes listeners and timers, and destroys the Daily call object before another call can start. A denied microphone permission offers Settings when the OS cannot prompt again.

## Verification

```bash
npx tsc --noEmit
npm run lint
node --test scripts/*.test.cjs
npx expo config --type introspect
npx expo export --platform android
```

`scripts/voice-mode.test.cjs` covers turn/transcript updates, mute, rapid taps, canceled permissions and sessions, stale callbacks, teardown ordering, remote endings, connection timeout, expired sessions, Origin consistency, provider error redaction, room URL validation, missing native modules, audio-only subscription and the Vapi `playable` handshake. Tests use fake native audio and network responses, and make no live calls.

Implementation checks on 18 November 2026: TypeScript, lint, all 39 regression tests, Android/iOS/web JavaScript exports, and microphone-only native config introspection passed. No existing dependency versions were changed. `npx expo install --check` recommends newer patches for four existing dependencies (`expo`, `@expo/ui`, `expo-router`, `expo-web-browser`); those updates are outside this feature change.

A successful JS export and config introspection do not prove that native compilation or device audio works. Before release, build and test on physical Android and iOS devices:

1. Enable voice in platform settings. Confirm disabled settings hide the button, then start an authenticated workspace call.
2. Deny microphone access, retry, grant it through Settings, and reconnect.
3. Speak several turns, verify automatic spoken replies and live transcripts, then interrupt a reply. Test speaker, wired/Bluetooth headphones, and device audio interruptions.
4. Mute and speak; Hoopi must not receive that speech. Unmute and speak again.
5. Cancel during permission, backend provisioning, and room connection. No delayed connection or microphone indicator should remain.
6. End a connected call, navigate between tabs/recent chats, create a new chat, switch workspace, lock the device, and background the app. Each must release the microphone without automatically reconnecting.
7. Lose network access while connecting and while speaking. Verify a recoverable error and a clean subsequent call.
8. Confirm the text draft and chat thread are unchanged after a call. Repeat from a saved chat and with reduced motion enabled.

References: [Vapi React Native SDK source](https://github.com/VapiAI/react-native), [Daily React Native SDK](https://github.com/daily-co/react-native-daily-js), [Daily Expo plugin](https://github.com/daily-co/rn-daily-js-expo-config-plugin), [Expo Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio/).
