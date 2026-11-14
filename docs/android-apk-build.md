# Build an Android APK with Expo EAS

This project is already linked to an Expo project and has its Android application ID configured. Use the `preview` EAS profile to create an installable APK on Expo's cloud build service.

## Requirements

- An Expo account.
- EAS CLI installed and signed in (`eas whoami` should show your account).
- Run commands from the `mobile/` project directory.

If needed, install or sign in to EAS CLI:

```bash
npm install --global eas-cli
eas login
```

## Build the APK

Install the project dependencies, then submit the preview build:

```bash
npm install
eas build --platform android --profile preview
```

The `preview` profile in `eas.json` uses internal distribution and explicitly sets Android's `buildType` to `apk`. EAS uploads the project and builds it on Expo's servers. The CLI prints a build page link where you can follow progress and download the finished `.apk`.

## Install it

Open the EAS build page on your Android device and download the APK, then approve installation if Android asks. If Android Debug Bridge (ADB) is installed and the device is connected with USB debugging enabled, you can install a downloaded APK from your computer:

```bash
adb install path/to/hoopi.apk
```

## App identity and signing

The Android package ID is set in `app.json` as `com.saqibvizzexpodevsteam.hoopimobile`. Keep this ID stable after distributing the app; Android uses it to identify app installs and updates. EAS can create and manage the Android signing credentials during the first build.

For a Google Play release, use an Android App Bundle (`.aab`) production build instead. The APK preview profile is intended for direct installation and internal testing.

## References

- [Build APKs with EAS](https://docs.expo.dev/build-reference/apk/)
- [Configure EAS Build with `eas.json`](https://docs.expo.dev/eas/json/)
