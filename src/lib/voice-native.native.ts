import { NativeModules, Platform } from 'react-native';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import type { DailyCall, DailyEvent, DailyEventObject } from '@daily-co/react-native-daily-js';
import { createVapiCall } from './vapi-call';
import { VoicePermissionError, type VoiceEvent, type VoiceSession, type VoiceTransport } from './voice-mode';

type DailySDK = typeof import('@daily-co/react-native-daily-js');
let sdk: DailySDK | null = null;
let closingCall: Promise<void> = Promise.resolve();

export async function prepareNativeVoice() {
  if (Platform.OS === 'web' || !NativeModules.WebRTCModule || !NativeModules.DailyNativeUtils || !NativeModules.RNBackgroundTimer) {
    throw new Error(__DEV__ ? 'Voice mode needs a new development build or APK; it is not included in Expo Go.' : 'Voice mode needs an updated app. Please install the latest Hoopi build.');
  }
  const permission = await requestRecordingPermissionsAsync();
  if (!permission.granted) throw new VoicePermissionError(!permission.canAskAgain);
  // No WebRTC code runs during app startup or inside Expo Go.
  sdk ??= await import('@daily-co/react-native-daily-js');
}

/** Native audio-only Daily transport, using Vapi's public call/message protocol. */
export class NativeVoiceTransport implements VoiceTransport {
  private call: DailyCall | null = null;
  private stopped = false;
  private removeListeners: (() => void)[] = [];
  private speakingTimer: ReturnType<typeof setTimeout> | null = null;
  constructor(private onEvent: (event: VoiceEvent) => void) {}

  async start(session: VoiceSession, signal: AbortSignal) {
    // A newly focused chat may start while the previous screen is tearing down.
    try { await closingCall; } catch { throw new Error('The previous voice call could not close. Restart the app before reconnecting.'); }
    if (this.stopped || signal.aborted) return;
    const url = await createVapiCall(session, signal);
    if (this.stopped || signal.aborted) return;
    if (!sdk) throw new Error('Voice audio is not ready. Please try again.');
    const call = sdk.default.createCallObject({ audioSource: true, videoSource: false });
    this.call = call;
    const emit = (event: VoiceEvent) => { if (!this.stopped && !signal.aborted) this.onEvent(event); };
    // Video audio mode routes to speaker/headphones; it does not enable video.
    call.setNativeInCallAudioMode('video');
    const on = <T extends DailyEvent>(event: T, listener: (event: DailyEventObject<T>) => void) => {
      call.on(event, listener);
      this.removeListeners.push(() => call.off(event, listener));
    };
    on('joined-meeting', () => emit({ type: 'ready' }));
    on('left-meeting', () => emit({ type: 'ended' }));
    on('participant-left', event => { if (event && !event.participant.local) emit({ type: 'ended' }); });
    on('error', () => emit({ type: 'error', error: { message: 'The voice connection was lost. Check your connection and try again.' } }));
    on('camera-error', () => emit({ type: 'error', error: { message: 'Could not access your microphone. Check its permission and try again.', settings: true } }));
    on('app-message', event => {
      if (!event) return;
      if (event.data === 'listening') { emit({ type: 'ready' }); return; }
      try { emit({ type: 'message', message: typeof event.data === 'string' ? JSON.parse(event.data) : event.data }); } catch { /* Ignore non-JSON control messages. */ }
    });
    on('participant-joined', event => {
      if (event && !event.participant.local) call.updateParticipant(event.participant.session_id, { setSubscribedTracks: { audio: true, video: false } });
    });
    on('track-started', event => {
      if (event?.track.kind === 'audio' && !event.participant?.local && event.participant?.user_name === 'Vapi Speaker') call.sendAppMessage('playable');
    });
    on('remote-participants-audio-level', event => {
      if (this.stopped || signal.aborted || !event) return;
      if (Object.values(event.participantsAudioLevel).reduce((total, level) => total + level, 0) <= 0.01) return;
      if (this.speakingTimer) clearTimeout(this.speakingTimer);
      else emit({ type: 'speaking' });
      this.speakingTimer = setTimeout(() => { this.speakingTimer = null; emit({ type: 'listening' }); }, 1000);
    });
    await call.join({ url, subscribeToTracksAutomatically: false });
    if (this.stopped || signal.aborted) return;
    await call.startRemoteParticipantsAudioLevelObserver(100);
  }

  setMuted(muted: boolean) { this.call?.setLocalAudio(!muted); }

  async stop() {
    this.stopped = true;
    if (this.speakingTimer) clearTimeout(this.speakingTimer);
    this.speakingTimer = null;
    const call = this.call; this.call = null;
    if (!call) return;
    // Remove callbacks before destroying, which itself emits left-meeting.
    for (const remove of this.removeListeners) remove();
    this.removeListeners = [];
    // destroy() also leaves the room, including when join() is still pending.
    closingCall = (async () => { try { call.setLocalAudio(false); } finally { await call.destroy(); } })();
    await closingCall;
  }
}
