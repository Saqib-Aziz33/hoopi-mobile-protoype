import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { useFocusEffect } from 'expo-router';
import type { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Dictation, type DictationError, type DictationStatus } from '@/lib/dictation';

function recognitionModule() {
  // Importing the package's runtime entry directly would throw inside Expo Go.
  return requireOptionalNativeModule<typeof ExpoSpeechRecognitionModule>('ExpoSpeechRecognition');
}

export function useVoiceInput(text: string, onText: (text: string) => void, beforeStart: () => Promise<void>, disabled: boolean) {
  const [status, setStatus] = useState<DictationStatus>('idle');
  const [error, setError] = useState<DictationError | null>(null);
  const [dictation] = useState(() => new Dictation(recognitionModule(), onText, setStatus, setError, beforeStart, __DEV__ ? 'Voice input needs a new development build or APK; it is not included in Expo Go.' : 'Voice input is not available in this app build. You can use your keyboard’s microphone instead.'));
  const cancel = useCallback(() => dictation.cancel(), [dictation]);
  useFocusEffect(useCallback(() => cancel, [cancel]));
  useEffect(() => {
    if (disabled) dictation.cancel();
  }, [disabled, dictation]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      // iOS permission dialogs temporarily make the app inactive.
      if (state === 'background' || (state !== 'active' && dictation.status !== 'requesting')) dictation.cancel();
    });
    return () => listener.remove();
  }, [dictation]);
  const toggle = useCallback(() => {
    if (dictation.status !== 'idle') { dictation.stop(); return; }
    if (disabled) return;
    let language = 'en-US';
    try { language = Intl.DateTimeFormat().resolvedOptions().locale || language; } catch { /* use default */ }
    void dictation.start(text, language);
  }, [dictation, disabled, text]);
  return { status, error, active: status !== 'idle', toggle, cancel, clearError: useCallback(() => setError(null), []) };
}
