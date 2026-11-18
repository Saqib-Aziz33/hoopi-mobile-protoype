import type { VoiceEvent, VoiceSession, VoiceTransport } from './voice-mode';

// Metro selects voice-native.native.ts on Android/iOS. Keep WebRTC out of web bundles.
export async function prepareNativeVoice(): Promise<void> { throw new Error('Live voice is available in the Android and iOS apps.'); }
export class NativeVoiceTransport implements VoiceTransport {
  constructor(private onEvent: (event: VoiceEvent) => void) {}
  async start(_session: VoiceSession, _signal: AbortSignal): Promise<void> { await prepareNativeVoice(); }
  setMuted(_muted: boolean) {}
  async stop() {}
}
