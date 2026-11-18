import { speechChunks, speechText } from './speech-text';

type SpeechEngine = {
  maxSpeechInputLength: number;
  stop: () => Promise<void>;
  speak: (text: string, options: { onDone: () => void; onStopped: () => void; onError: (error: Error) => void; useApplicationAudioSession: boolean }) => void;
};

export class ReadAloud {
  private version = 0;
  private messageId: string | null = null;

  constructor(private readonly engine: SpeechEngine, private readonly onChange: (id: string | null) => void, private readonly onError: (error: unknown) => void) {}

  async stop() {
    this.version++;
    this.messageId = null;
    this.onChange(null);
    await this.engine.stop().catch(() => undefined);
  }

  async toggle(id: string, source: string) {
    if (this.messageId === id) return this.stop();
    const version = ++this.version;
    const chunks = speechChunks(speechText(source), this.engine.maxSpeechInputLength);
    this.messageId = chunks.length ? id : null;
    this.onChange(this.messageId);
    const finish = () => {
      if (version !== this.version) return;
      this.messageId = null;
      this.onChange(null);
    };
    const fail = (error: unknown) => {
      if (version !== this.version) return;
      finish();
      this.version++;
      void this.engine.stop().catch(() => undefined);
      this.onError(error);
    };
    const speak = (index: number) => {
      if (version !== this.version) return;
      if (index >= chunks.length) { finish(); return; }
      try {
        this.engine.speak(chunks[index], { onDone: () => speak(index + 1), onStopped: finish, onError: fail, useApplicationAudioSession: false });
      } catch (error) { fail(error); }
    };
    try {
      await this.engine.stop();
      speak(0);
    } catch (error) { fail(error); }
  }
}
