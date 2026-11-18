# Read aloud and voice input

These features follow the separate controls in the web app's `agent-chat.tsx`: read an assistant message aloud, or dictate text into the composer and review it before sending.

## Read aloud

Completed assistant messages in both new and saved chats have a Read aloud action. Tap it again to stop. Selecting another message stops the previous one. Reading also stops when the screen loses focus, a new chat starts, dictation starts, or the app leaves the foreground.

Expo Speech uses the device's text-to-speech engine. Markdown is converted to readable text, and long replies are split into chunks below the native speech limit. On iOS, silent mode can prevent audio; turn silent mode off when testing.

## Voice input

Tap the composer's microphone, allow microphone/speech recognition access, and speak. Interim text appears in the composer alongside the draft you already typed. Native recognition ends the utterance after a pause; you can also tap Stop to finish. Wait for the final transcript, then edit or send it yourself. Tap the microphone again to append another utterance.

Cancel stops listening and preserves the text already shown. Navigation, a new chat, or backgrounding the app cancels pending recognition. Permission requests and late native events cannot resume a canceled session or overwrite a new draft. Read-aloud controls and sending are disabled while dictation is active. Starting dictation stops any read-aloud playback.

Recognition uses the device's default speech service and locale. Language support and network requirements depend on that service. Hoopi does not persist an audio recording or upload a recording to its backend; only the reviewed text goes through the existing chat API when Send is tapped.

## Build and run

Read aloud works in the matching Expo Go SDK. Voice input uses `expo-speech-recognition`, a custom native module that is not included in Expo Go. It requires a new APK or a development build containing the module; a JavaScript reload alone cannot add it. The app handles a missing module gracefully and explains the build requirement instead of crashing.

The config plugin in `app.json` supplies iOS microphone and speech-recognition usage descriptions, Android microphone permission, and Android speech-service visibility.

For an installable Expo cloud APK:

```bash
npm install
npx eas-cli@latest build --platform android --profile preview
```

For a development client, first add `expo-dev-client` with `npx expo install expo-dev-client`, then use the EAS `development` build profile. See the [APK guide](android-apk-build.md) for signing and installation details.

## Checks

```bash
npx tsc --noEmit
npm run lint
node --test scripts/*.test.cjs
```

The speech tests exercise Markdown conversion, long-message chunking, playback cancellation, transcript replacement, late permission grants, canceled native events, permission denial, and unavailable native modules using fake native engines. They do not verify device audio, speech accuracy, or operating-system permission dialogs.

On a physical device:

1. Read a completed assistant message, stop it, switch to another reply, and test a long reply. Repeat in a saved conversation.
2. Begin reading, then navigate away or background the app. Playback should stop.
3. Type a draft, dictate a phrase, stop, edit the result, and send. Verify the original draft is preserved and the text sends only once.
4. Deny permission, then retry. If permission can no longer be requested, use Open settings to grant it.
5. Leave the screen while the permission prompt is pending or while listening. Returning must not restart recording or replace the draft with a delayed transcript.
6. Begin dictation while read-aloud is playing. Playback should stop before the microphone starts.

References: [Expo Speech](https://docs.expo.dev/versions/v58.0.0/sdk/speech/), [Expo Speech Recognition](https://github.com/jamsch/expo-speech-recognition).
