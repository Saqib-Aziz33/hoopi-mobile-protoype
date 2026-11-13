# Hoopi Mobile

Hoopi Mobile is a React Native app built with Expo Router. It provides native sign-in, workspace-aware AI chat, work activity, Knowledge documents, and file storage.

## Start developing

```bash
npm install
npx expo start
```

Use the Expo Go app, an iOS simulator, or an Android emulator to open the development app. For native modules and production-like behavior, use an Expo development build.

## App structure

- `src/app/login.tsx` and `src/app/register.tsx` handle account access.
- `src/app/(tabs)/` contains the Chat, Work, Knowledge, Files, and account tabs.
- `src/lib/api.ts` is the API client and feature API layer.
- `src/context/auth.tsx` keeps the signed-in profile and secure token session.
- `src/components/ui.tsx` contains shared Hoopi colors and native UI primitives.

The shared brand palette is sampled from the app mark: violet `#4816FB`, blue `#2559FB`, and cyan `#02D1FC`, paired with cool white and lavender surfaces. Reanimated provides spring press feedback and screen, card, and message entrances.

The API base URL is `https://api.hoopi.ai`. Access tokens and workspace selection are stored with Expo SecureStore. Chat uses the agent streaming endpoint; document and file operations use the same API resources as the website.

## Checks

```bash
npx tsc --noEmit
npm run lint
```
