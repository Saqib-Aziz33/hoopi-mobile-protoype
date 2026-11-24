/** Warm editorial palette shared by gluestack, navigation, and native controls. */
export const C = {
  canvas: "#FAF7F1",
  paper: "#FFFDFA",
  ink: "#332D2B",
  primary: "#713F52",
  blue: "#67736A",
  cyan: "#B97758",
  moss: "#796F65",
  muted: "#A3988E",
  line: "#E5DDD2",
  lavender: "#EEE3E8",
  blueTint: "#E9EDE5",
  coral: "#B76D50",
  peach: "#F1E1D4",
  sage: "#E5E9DE",
  white: "#FFFDFA",
  red: "#AE4650",
  amber: "#94662F",
  green: "#4F6B57",
  greenTint: "#E7EDE2",
} as const;

export const primaryScale = {
  0: "#FFFCFD",
  50: "#F8F1F4",
  100: C.lavender,
  200: "#DFCAD3",
  300: "#C5A1B0",
  400: "#A9758A",
  500: C.primary,
  600: "#633347",
  700: "#512A3A",
  800: "#42242F",
  900: "#352029",
  950: "#24161D",
} as const;

export const Layout = { gutter: 26, maxWidth: 760 } as const;
