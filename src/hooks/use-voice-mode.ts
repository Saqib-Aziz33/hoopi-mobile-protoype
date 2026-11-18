import { useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { voiceApi } from '@/lib/voice-api';
import { NativeVoiceTransport, prepareNativeVoice } from '@/lib/voice-native';
import { VoiceMode, idleVoiceState } from '@/lib/voice-mode';

export function useVoiceMode(workspaceId: number | undefined, beforeStart: () => Promise<void>, disabled: boolean) {
  const [state, setState] = useState(idleVoiceState);
  const [voice] = useState(() => new VoiceMode({ prepare: prepareNativeVoice, beforeStart, session: voiceApi.session, transport: onEvent => new NativeVoiceTransport(onEvent) }, setState));
  const [settings, setSettings] = useState<{ workspaceId: number; enabled: boolean } | null>(null);
  const configured = !!workspaceId && settings?.workspaceId === workspaceId && settings.enabled;
  const stop = useCallback(() => { void voice.stop(); }, [voice]);
  const clear = useCallback(() => voice.clear(), [voice]);

  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (voice.state.status === 'idle') return false;
      stop();
      return true;
    });
    return () => listener.remove();
  }, [voice, stop]));

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    if (workspaceId) {
      void voiceApi.settings(controller.signal).then(result => {
        if (controller.signal.aborted) return;
        setSettings({ workspaceId, enabled: result.features?.voice === true });
        if (result.features?.voice !== true) stop();
      }).catch(() => {
        if (!controller.signal.aborted) { setSettings(null); stop(); }
      });
    }
    return () => { controller.abort(); stop(); };
  }, [workspaceId, stop]));
  useEffect(() => { if (disabled || !configured) stop(); }, [disabled, configured, stop]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', next => {
      // The microphone permission prompt briefly makes iOS inactive.
      if (next === 'background' || (next !== 'active' && voice.state.status !== 'requesting')) stop();
    });
    return () => listener.remove();
  }, [voice, stop]);

  const start = useCallback(() => {
    if (configured && !disabled && AppState.currentState === 'active') void voice.start();
  }, [configured, disabled, voice]);
  const toggleMuted = useCallback(() => voice.toggleMuted(), [voice]);
  return { ...state, configured, active: state.status !== 'idle', start, stop, clear, toggleMuted };
}
