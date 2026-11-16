/** Decode SSE frames across arbitrary network chunks, including a final frame at EOF. */
export class EventStreamDecoder {
  private buffer = '';
  private data: string[] = [];

  constructor(private readonly onEvent: (event: Record<string, unknown>) => void) {}

  push(chunk: string, end = false) {
    this.buffer += chunk;
    let newline: number;
    while ((newline = this.buffer.indexOf('\n')) !== -1) {
      this.line(this.buffer.slice(0, newline).replace(/\r$/, ''));
      this.buffer = this.buffer.slice(newline + 1);
    }
    if (end) {
      if (this.buffer) this.line(this.buffer.replace(/\r$/, ''));
      this.buffer = '';
      this.dispatch();
    }
  }

  private line(line: string) {
    if (!line) this.dispatch();
    else if (line.startsWith('data:')) this.data.push(line.slice(5).replace(/^ /, ''));
  }

  private dispatch() {
    if (!this.data.length) return;
    const raw = this.data.join('\n');
    this.data = [];
    let event: unknown;
    try { event = JSON.parse(raw); } catch { return; }
    if (event && typeof event === 'object' && !Array.isArray(event)) this.onEvent(event as Record<string, unknown>);
  }
}
