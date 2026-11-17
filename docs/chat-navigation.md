# Recent-chat navigation and keyboard motion

## 1. Back exited the app from recent chats

Recent chats previously replaced the conversation using a local `historyOpen` boolean. The navigation stack still contained only the root Chat screen. Android Back (including its system back gesture) therefore reached the root and exited instead of closing that panel. There was also no native stack entry for a saved conversation.

Chat now has a nested native stack:

```text
Chat index → Recent chats → Saved conversation
```

Back returns through those screens. iOS uses the stack's native swipe-back gesture. The index remains mounted, preserving its draft and conversation. Starting a new chat from a saved conversation returns to the index and resets its identity. Android Back from the actual root retains normal platform behavior.

## 2. Keyboard dismissal jumped when navigation returned

The tab bar had `tabBarHideOnKeyboard: true`, while a separate React Native KeyboardAvoidingView adjusted the screen. The tab bar and keyboard used independent animation timing, and hiding/showing the bar changed the available layout space.

The tab bar now stays mounted with stable layout space. The keyboard covers it while open. A KeyboardProvider and the Keyboard Controller avoiding view follow native keyboard progress, including the closing motion. Automatic offset measurement accounts for the screen's true position rather than using a guessed header or tab height. The same avoiding view is used by authentication forms.

## 3. Opening a saved conversation bounced and jumped

The old flow immediately removed history, briefly exposed the previous conversation or welcome view, inserted a loading indicator above it, then animated every restored message with a spring while scrolling to the bottom as content was measured.

A saved conversation now has its own screen and a stable loading state. Restored rows have no entrance animation, and the generic screen fade is disabled there so only the native stack transition runs. The message list uses newest-first data with an inverted FlatList, which starts at the latest message without an initial top-to-bottom scroll. Chronological message state remains unchanged. Visible-content anchoring preserves a reader's place, and Latest messages scrolls to offset zero.

## Validation

```bash
npx tsc --noEmit
npm run lint
node --test scripts/chat-session.test.cjs scripts/event-stream.test.cjs
```

Device checks:

1. From Chat, open Recent chats, then use Android Back or iOS swipe-back. Confirm the previous Chat screen returns with its draft intact.
2. Open a saved conversation. Back should return to Recent chats; Back again should return to Chat.
3. Open and close the keyboard several times, including Android's keyboard-dismiss gesture. Confirm the input follows the keyboard and navigation does not slide out and reappear separately.
4. Open both short and long saved chats. Confirm there is no welcome-screen flash, message cascade, or visible scroll from the oldest message to the latest.
5. Scroll upward during a streamed response, then dismiss the keyboard. Confirm the reading position is retained; Latest messages should return to the end.
6. Start a new chat from a saved conversation and send a message. Confirm it creates a separate history entry.

These automated checks do not verify physical-device animation timing or OS gestures. A fresh installed APK/development build is required for the new native Keyboard Controller dependency. It is included in the matching Expo Go SDK.

References: [Expo stack navigation](https://docs.expo.dev/router/advanced/stack/), [Expo Keyboard Controller](https://docs.expo.dev/versions/v58.0.0/sdk/keyboard-controller/), [FlatList](https://reactnative.dev/docs/flatlist).
