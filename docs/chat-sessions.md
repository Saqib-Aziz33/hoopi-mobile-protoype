# Conversation identity

The chat API identifies a conversation using `conversation_id` or `thread_key`. Omitting both does not create a fresh conversation: the backend falls back to the signed-in user's persistent default thread.

Mobile now keeps a `ChatSession` for the current screen. On the first send it generates a UUID-backed thread key using Expo Crypto. Following messages and retries keep that key, including when a connection ends before a completion event arrives. Server-returned IDs update the session. Opening a saved conversation restores both its public ID and thread key.

The new-chat action cancels obsolete requests and clears both identifiers. Workspace changes use the same reset. A fresh app session also starts without an identity and generates a new key on its first send. Empty chats do not create backend records.

## Verification

```bash
node --test scripts/chat-session.test.cjs scripts/event-stream.test.cjs
npx tsc --noEmit
npm run lint
```

The session regression tests exercise the same identity object used by the chat screen. A small in-memory history fixture models the backend's documented ID/thread resolution; these checks do not call the live API.

On a device:

1. Send a message, then a follow-up. Both should belong to the same conversation.
2. Tap + and send a different prompt. Recent chats should now include two separate entries.
3. Open the first entry and send another message. Only that conversation should continue.
4. Close and reopen the app, then send a new prompt. It should create another entry.
5. Try a new chat while a response is streaming. The canceled response should not change the new chat's identity.

Previously combined messages remain in their original conversation. This fix does not rewrite or split existing history.

Expo Crypto is included in the matching Expo Go SDK. Installed APKs and custom development clients need rebuilding to include the added native dependency.
