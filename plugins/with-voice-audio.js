/*
Adapted from @daily-co/config-plugin-rn-daily-js 0.0.13.
https://github.com/daily-co/rn-daily-js-expo-config-plugin

BSD 2-Clause License

Copyright (c) 2022, daily
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
// Audio-only subset of Daily's official Expo plugin, using SDK 58's config API.
// The published plugin currently excludes SDK 58 in its Expo peer range.
const { AndroidConfig, withAndroidManifest, withAppBuildGradle, withInfoPlist } = require('expo/config-plugins');

module.exports = function withVoiceAudio(config) {
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.ACCESS_NETWORK_STATE', 'android.permission.INTERNET',
    'android.permission.WAKE_LOCK', 'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  ]);
  config = withInfoPlist(config, value => {
    value.modResults.NSMicrophoneUsageDescription = 'Allow Hoopi to use your microphone for voice input and live voice conversations.';
    return value;
  });
  config = withAndroidManifest(config, value => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(value.modResults);
    app.service ??= [];
    const name = 'com.daily.reactlibrary.DailyOngoingMeetingForegroundService';
    if (!app.service.some(service => service.$['android:name'] === name)) app.service.push({ $: { 'android:name': name, 'android:exported': 'false', 'android:foregroundServiceType': 'microphone' } });
    return value;
  });
  return withAppBuildGradle(config, value => {
    const setting = 'android.packagingOptions.jniLibs.useLegacyPackaging = true';
    if (!value.modResults.contents.includes(setting)) value.modResults.contents += `\n${setting}\n`;
    return value;
  });
};
