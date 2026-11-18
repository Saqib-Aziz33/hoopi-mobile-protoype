export type DictationStatus = 'idle' | 'requesting' | 'listening' | 'finishing';
export type DictationError = { message: string; settings?: boolean };
// Type-only: loading this controller never requires the native module.
export type RecognitionEngine = Pick<typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule, 'isRecognitionAvailable' | 'requestPermissionsAsync' | 'start' | 'stop' | 'abort' | 'addListener'>;
type Run = { base: string; started: boolean; listeners: { remove: () => void }[] };

export function dictationText(base: string, transcript: string) {
  if (!transcript.trim()) return base;
  return `${base.trimEnd()}${base.trim() ? ' ' : ''}${transcript.trim()}`;
}

/** One native utterance at a time; interim results replace rather than append. */
export class Dictation {
  status: DictationStatus = 'idle';
  private run: Run | null = null;

  constructor(private readonly engine: RecognitionEngine | null, private readonly onText: (text: string) => void, private readonly onStatus: (status: DictationStatus) => void, private readonly onError: (error: DictationError | null) => void, private readonly beforeStart: () => Promise<void>, private readonly missingModuleMessage: string) {}

  private setStatus(status: DictationStatus) { this.status = status; this.onStatus(status); }
  private close(run: Run) {
    if (this.run !== run) return;
    this.run = null;
    for (const listener of run.listeners) listener.remove();
    this.setStatus('idle');
  }
  cancel() {
    const run = this.run;
    if (!run) return;
    this.close(run);
    if (run.started) { try { this.engine?.abort(); } catch { /* already stopped */ } }
  }
  stop() {
    if (this.status === 'requesting' || this.status === 'finishing') { this.cancel(); return; }
    if (!this.run) return;
    this.setStatus('finishing');
    try { this.engine?.stop(); } catch { this.cancel(); }
  }

  async start(base: string, language: string) {
    if (this.run) return;
    const run: Run = { base, started: false, listeners: [] };
    this.run = run;
    this.setStatus('requesting');
    this.onError(null);
    const fail = (message: string, settings = false) => {
      if (this.run !== run) return;
      this.close(run);
      this.onError({ message, settings });
    };
    try {
      const engine = this.engine;
      if (!engine) { fail(this.missingModuleMessage); return; }
      if (!engine.isRecognitionAvailable()) { fail('Speech recognition is not available on this device. Check your device’s speech service.'); return; }
      await this.beforeStart();
      if (this.run !== run) return;
      const permission = await engine.requestPermissionsAsync();
      if (this.run !== run) return;
      if (!permission.granted) { fail('Microphone and speech recognition access are needed for voice input.', !permission.canAskAgain); return; }
      run.listeners.push(
        engine.addListener('start', () => { if (this.run === run) this.setStatus('listening'); }),
        engine.addListener('result', event => {
          const transcript = event.results[0]?.transcript;
          if (this.run === run && transcript) this.onText(dictationText(run.base, transcript));
        }),
        engine.addListener('end', () => this.close(run)),
        engine.addListener('error', event => {
          if (event.error === 'aborted') { this.close(run); return; }
          const messages: Record<string, string> = {
            'no-speech': 'No speech detected. Tap the microphone to try again.',
            'speech-timeout': 'No speech detected. Tap the microphone to try again.',
            network: 'Speech recognition could not connect. Check your connection and try again.',
            'not-allowed': 'Allow microphone and speech recognition access in your device settings.',
            'language-not-supported': 'Your device’s speech service does not support the current language.',
            interrupted: 'Voice input was interrupted. Your draft has been kept.',
          };
          fail(messages[event.error] ?? 'Voice input stopped. Your draft has been kept; you can try again.', event.error === 'not-allowed');
        }),
      );
      run.started = true;
      engine.start({ lang: language, interimResults: true, continuous: false, maxAlternatives: 1, iosTaskHint: 'dictation', recordingOptions: { persist: false } });
    } catch {
      if (this.run === run) {
        this.cancel();
        this.onError({ message: 'Could not start voice input. Please try again.' });
      }
    }
  }
}
