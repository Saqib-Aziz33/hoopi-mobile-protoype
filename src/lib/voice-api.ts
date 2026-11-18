import { api } from './api';
import { VAPI_ORIGIN } from './vapi-call';
import type { VoiceSession } from './voice-mode';

export const voiceApi = {
  settings: (signal: AbortSignal) => api<{ features?: Record<string, boolean> }>('/settings/public', { signal }),
  session: (signal: AbortSignal) => api<VoiceSession>('/voice/session', { method: 'POST', signal, headers: { Origin: VAPI_ORIGIN } }),
};
