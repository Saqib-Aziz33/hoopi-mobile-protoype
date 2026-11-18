import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { ReadAloud } from '@/lib/read-aloud';

export function useReadAloud() {
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);
  const [reader] = useState(() => new ReadAloud(Speech, setReadingMessageId, () => Alert.alert('Could not read aloud', 'Please check your device’s text-to-speech settings and try again.')));
  useFocusEffect(useCallback(() => () => { void reader.stop(); }, [reader]));
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') void reader.stop(); });
    return () => listener.remove();
  }, [reader]);
  return { readingMessageId, stopReading: useCallback(() => reader.stop(), [reader]), readAloud: useCallback((id: string, content: string) => reader.toggle(id, content), [reader]) };
}
