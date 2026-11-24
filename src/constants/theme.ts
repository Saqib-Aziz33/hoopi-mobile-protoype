/** Shared colors for legacy themed helpers. New screens use gluestack UI. */

import { Platform } from "react-native";
import { C } from "@/constants/design";

export const Colors = {
  light: {
    text: C.ink,
    background: C.canvas,
    backgroundElement: C.paper,
    backgroundSelected: C.lavender,
    textSecondary: C.moss,
  },
  dark: {
    text: "#F5F6FF",
    background: "#111326",
    backgroundElement: "#1C2038",
    backgroundSelected: "#30235F",
    textSecondary: "#A7ADC5",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
