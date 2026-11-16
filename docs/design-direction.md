# Hoopi: a working notebook

## Research

Reviewed on 16 November 2026:

- [Linear: A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh). Linear describes reducing decorative icon backgrounds, letting navigation recede, and preserving useful information density.
- [Things: All-new design](https://culturedcode.com/things/features/). The product uses clear grouping and paper-like editing surfaces, with details available when needed.
- [Apple: Principles of great design](https://developer.apple.com/videos/play/wwdc2026/250/). The talk emphasizes purpose, hierarchy, plain language, and intentional restraint.

These references informed the direction; Hoopi uses its own visual language and assets.

## Decisions

- Treat the app as a working notebook: serif display headings, native system body text, open reading surfaces, and simple rules between records.
- Preserve the logo colors: violet `#4816FB`, blue `#2559FB`, cyan `#02D1FC`. Use neutral paper surfaces so these colors have a clear role. Violet identifies actions and selection; cyan is a small brand detail.
- Replace repeated rounded containers with layouts that match the content: numbered conversation starters, a work ledger, and document rows.
- Keep the original logo. A small five-ray line drawing echoes the hoopoe crest in the logo without replacing the original mark.
- Use direct functional copy. Titles describe the content or action rather than repeating promotional slogans.
- Keep native keyboard handling, safe areas, readable body text, minimum 44-point actions, reduced-motion behavior, and visible selected states.

## Interactions

Files and Knowledge filter loaded records by filename. Work has local All activity, In progress, and Completed views over the recent runs returned by the API. Search and filters do not change backend data.

## Review

Check narrow screens, large text, keyboard visibility, long filenames, and empty, loading, error, and populated states. Serif display fonts use Georgia on iOS and the system serif on Android; the exact letterforms vary by platform.
