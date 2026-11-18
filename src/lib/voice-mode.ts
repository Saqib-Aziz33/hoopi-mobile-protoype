export type VoiceStatus = 'idle' | 'requesting' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ending';
export type VoiceError = { message: string; settings?: boolean };
export type VoiceSession = { token: string; assistantId: string; expiresAt: string };
export type VoiceState = { status: VoiceStatus; heard: string; answer: string; muted: boolean; error: VoiceError | null };
export type VoiceEvent = { type: 'ready' | 'speaking' | 'listening' | 'ended' } | { type: 'message'; message: unknown } | { type: 'error'; error: VoiceError };
export interface VoiceTransport {
  start(session: VoiceSession, signal: AbortSignal): Promise<void>;
  setMuted(muted: boolean): void;
  stop(): Promise<void>;
}
export const idleVoiceState: VoiceState = { status: 'idle', heard: '', answer: '', muted: false, error: null };

export class VoicePermissionError extends Error {
  constructor(public settings: boolean) { super('Allow microphone access to talk with Hoopi.'); }
}

/** Owns one foreground call. Canceled permission, session and transport callbacks cannot revive it. */
export class VoiceMode {
  state: VoiceState = { ...idleVoiceState };
  private version = 0;
  private controller: AbortController | null = null;
  private transport: VoiceTransport | null = null;
  private cleanup: Promise<void> = Promise.resolve();
  private cleanupFailed = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private dependencies: {
    prepare: () => Promise<void>;
    beforeStart: () => Promise<void>;
    session: (signal: AbortSignal) => Promise<VoiceSession>;
    transport: (onEvent: (event: VoiceEvent) => void) => VoiceTransport;
  }, private onChange: (state: VoiceState) => void, private timeoutMs = 45000) {}

  private update(patch: Partial<VoiceState>) {
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }
  private clearTimer() { if (this.timer !== null) clearTimeout(this.timer); this.timer = null; }
  clear() { this.update({ heard: '', answer: '', error: null }); }

  async start() {
    if (this.state.status !== 'idle') return;
    if (this.cleanupFailed) { this.update({ error: { message: 'The previous voice call could not close. Restart the app before reconnecting.' } }); return; }
    const version = ++this.version;
    const controller = new AbortController();
    this.controller = controller;
    const current = () => version === this.version && !controller.signal.aborted;
    this.update({ ...idleVoiceState, status: 'requesting' });
    try {
      await this.cleanup;
      if (!current()) return;
      await this.dependencies.beforeStart();
      if (!current()) return;
      await this.dependencies.prepare();
      if (!current()) return;
      this.update({ status: 'connecting' });
      this.timer = setTimeout(() => { if (current()) void this.stop({ message: 'The voice call took too long to connect. Please try again.' }); }, this.timeoutMs);
      const session = await this.dependencies.session(controller.signal);
      if (!current()) return;
      if (!session.token || !session.assistantId || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) throw new Error('The voice session expired. Please try again.');
      const transport = this.dependencies.transport(event => {
        if (current()) this.accept(event);
      });
      this.transport = transport;
      await transport.start(session, controller.signal);
    } catch (error) {
      if (!current()) return;
      await this.stop({ message: error instanceof Error ? error.message : 'Could not start the voice call. Please try again.', settings: error instanceof VoicePermissionError && error.settings });
    }
  }

  private accept(event: VoiceEvent) {
    if (event.type === 'ended') { void this.stop(); return; }
    if (event.type === 'error') { void this.stop(event.error); return; }
    if (event.type === 'ready') {
      this.clearTimer();
      if (this.state.status === 'connecting') this.update({ status: 'listening' });
    } else if (event.type === 'speaking' || event.type === 'listening') {
      this.clearTimer();
      this.update({ status: event.type });
    } else if (event.type === 'message' && event.message && typeof event.message === 'object') {
      const message = event.message as Record<string, unknown>;
      if (message.type === 'status-update' && message.status === 'ended') { void this.stop(); return; }
      if (message.type === 'speech-update' && message.role === 'assistant') {
        if (message.status === 'started' || message.status === 'stopped') this.accept({ type: message.status === 'started' ? 'speaking' : 'listening' });
      }
      if (message.type !== 'transcript' || typeof message.transcript !== 'string' || !message.transcript) return;
      if (message.role === 'user') {
        this.update({ heard: message.transcript, ...(message.transcriptType === 'final' ? { answer: '', status: 'thinking' } : {}) });
      } else if (message.role === 'assistant') this.update({ answer: message.transcript });
    }
  }

  toggleMuted() {
    if (!this.transport || ['idle', 'requesting', 'connecting', 'ending'].includes(this.state.status)) return;
    try {
      const muted = !this.state.muted;
      this.transport.setMuted(muted);
      this.update({ muted });
    } catch { void this.stop({ message: 'Could not change microphone access. Please reconnect.' }); }
  }

  stop(error?: VoiceError): Promise<void> {
    const version = ++this.version;
    this.controller?.abort(); this.controller = null;
    this.clearTimer();
    const transport = this.transport;
    this.transport = null;
    this.update({ status: transport ? 'ending' : this.state.status === 'ending' ? 'ending' : 'idle', muted: false, error: error ?? this.state.error });
    // Serialize teardown: Daily permits only one call object at a time.
    this.cleanup = this.cleanup.then(async () => { if (transport) await transport.stop(); }).catch(() => {
      this.cleanupFailed = true;
      if (version === this.version) this.update({ error: { message: 'Could not fully close the voice call. Restart the app before reconnecting.' } });
    });
    return this.cleanup.then(() => { if (version === this.version) this.update({ status: 'idle' }); });
  }
}
