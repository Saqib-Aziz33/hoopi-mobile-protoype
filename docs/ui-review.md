# Motion and reliability review

The `feat/mobile-motion-and-reliability` branch improves interaction feedback and fixes issues found during a source review.

## Changes

- Screens and cards use short fades to avoid stacking several large entrance movements. Chat modes have a sliding selection indicator. Thinking dots respect the device's reduced-motion setting.
- Starting a new chat or loading another conversation cancels the previous stream. Request versions prevent delayed responses from changing a newer conversation, and a synchronous send guard blocks rapid duplicate submissions.
- Streaming content follows the bottom only while the reader is near it. Scrolling upward preserves the reading position; a Latest messages button returns to the bottom.
- The SSE decoder handles split chunks, CRLF, multiline data, and a final event without a trailing newline. Malformed events are ignored without swallowing consumer errors.
- Work, Files, and Knowledge show a retry notice on request failure. Existing data survives a failed refresh in the same workspace. Stale requests are ignored after focus changes.
- Chat resets when the workspace changes, including changes made from the account tab. Tab bar spacing includes the device's bottom safe area.

## Checks

Run from `mobile/`:

```bash
npx tsc --noEmit
npm run lint
node --test scripts/event-stream.test.cjs
```

The stream regression tests compile the TypeScript decoder in memory using the existing TypeScript development dependency. They require no additional test framework.

## Device review

These interactions still need visual review on a physical device or simulator:

1. Switch chat modes and tabs. Check label spacing above Android navigation controls or the iOS home indicator.
2. Enable reduced motion in device accessibility settings before launching the app. Check that thinking dots stay static.
3. Start a long response and scroll upward. Confirm the list stays at the reading position, then tap Latest messages.
4. Start a response, immediately start a new chat, and send another prompt. Confirm the old response does not appear in the new chat.
5. Open a saved chat, switch workspaces from You, and return to Chat. Confirm the old conversation is cleared.
6. Load a list, disconnect the network, and pull to refresh. Confirm the previous items remain with a retry notice. Reconnect and retry.
7. Focus the composer with a multiline prompt and confirm it stays above the keyboard. Check suggestions and send actions respond to the first tap.

Stopping the client stream cancels local reading; it does not guarantee that the backend has stopped its agent work.
