# Hoopi mobile UI system

The app uses gluestack-ui v3, NativeWind 4.2.7, and Tailwind CSS 3.4.19. The stable v3 component line avoids depending on NativeWind v5 release candidates. The Expo SDK, React Native version, API client, and auth/session lifecycles remain unchanged.

## Changing the design

- `src/constants/design.ts`: shared palette, primary scale, and content width. Native navigation, icons, and Markdown share these tokens with gluestack.
- `src/components/ui/gluestack-ui-provider/config.ts`: semantic variables, with light brand values derived from shared tokens.
- `src/components/ui/`: source-owned gluestack Button, Input, FormControl, Badge, Box, Card, Text, Pressable, and Skeleton primitives, adapted from the upstream `main-v3` registry.
- `src/components/ui.tsx`: branded controls and compositions, including Screen, Heading, Button, IconButton, Field, StatusBadge, SegmentedControl, and CollectionSummary.
- `tailwind.config.js`: semantic color utilities and platform-specific system fonts.
- `src/global.css`, `babel.config.js`, `metro.config.js`: NativeWind integration. CSS is imported once in the root Expo Router layout.

Use semantic classes such as `bg-background-0`, `border-outline-200`, `text-typography-950`, and `bg-primary-500`. Reserve inline styles for computed values, native navigation, and animations. Keep palette changes in the shared tokens.

The app continues to ship a light appearance, explicitly selected in GluestackUIProvider and app.json. The upstream dark variable set does not imply full dark-mode support.

## Behavior

The warm editorial direction combines bundled Lora regular/italic headings with system sans serif body text, ivory surfaces, plum actions, and terracotta/sage accents. The native SVG botanical illustration gives the app a consistent visual motif without image downloads. Fonts are bundled locally under the SIL Open Font License and loaded before the app leaves its splash screen. Primary touch targets are at least 44 points. Chat uses a pair of suggestion tiles; Work uses a contrasting summary and a divided activity feed; files and documents use compact rows rather than enclosed cards. Shared controls expose accessible labels, focus feedback, and disabled/busy states. Loading placeholders respect reduced motion and stop their animation when unmounted.

Chat retains streaming, history, dictation, read aloud, voice calls, and keyboard handling. Suggestions fill the draft without sending it. Work retains status filtering and refresh. Knowledge and Files retain search, upload, refresh, and download/open behavior. Empty states distinguish empty workspaces from empty search results.

## Adding components

Sources are owned by this repository. Keep additions on the matching v3 registry. The unversioned latest CLI targets a different major version.

```bash
npx gluestack-ui@3.0.12 add <component>
```

Review generated files and install Expo/React Native dependencies with `npx expo install`.

## Validation

```bash
npm run lint
npx tsc --noEmit
node --test scripts/*.test.cjs
npx expo export --platform android --platform ios --output-dir /tmp/hoopi-native-export
```

Device checks should cover keyboard/composer placement, large system text, document selection, uploads/downloads, and live voice permissions. The web target's existing SecureStore limitation is outside this migration. Visual review uses a disposable copy with sample data, without changing production auth or calling the live backend.

Upstream sources: https://github.com/gluestack/gluestack-ui/tree/main-v3/src/components/ui
