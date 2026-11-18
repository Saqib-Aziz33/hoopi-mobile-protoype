import type { VoiceSession } from './voice-mode';

export const VAPI_ORIGIN = 'https://api.hoopi.ai';

/** The same /call/web handshake used by Vapi's web and React Native SDKs. */
export async function createVapiCall(session: VoiceSession, signal: AbortSignal, request: typeof fetch = fetch): Promise<string> {
  const response = await request('https://api.vapi.ai/call/web', {
    method: 'POST', signal,
    // Hoopi binds the short-lived token to this Origin at /voice/session.
    headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json', Origin: VAPI_ORIGIN },
    body: JSON.stringify({ assistantId: session.assistantId }),
  });
  if (!response.ok) {
    // Do not display raw provider payloads: these can include call URLs or tokens.
    throw new Error(response.status === 401 || response.status === 403 ? 'Voice access was denied. Please reconnect or contact your workspace administrator.' : 'The voice service could not connect. Please try again.');
  }
  const result = await response.json() as { webCallUrl?: unknown };
  if (typeof result.webCallUrl !== 'string') throw new Error('The voice service did not return a call. Please try again.');
  const url = new URL(result.webCallUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.daily.co') || url.username || url.password) throw new Error('The voice service returned an unsupported call address.');
  return url.toString();
}
