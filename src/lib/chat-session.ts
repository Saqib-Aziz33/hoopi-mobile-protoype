export type ChatRequest = {
  message: string;
  mode: 'chat' | 'work';
  thread_key: string;
  conversation_id?: string;
};

/** Identity belongs to a chat, not to a single send or the signed-in account. */
export class ChatSession {
  private threadKey: string | undefined;
  private conversationId: string | undefined;

  constructor(private readonly createId: () => string) {}

  reset() {
    this.threadKey = undefined;
    this.conversationId = undefined;
  }

  restore(conversation: { id: string; thread_key: string }) {
    this.threadKey = conversation.thread_key;
    this.conversationId = conversation.id;
  }

  request(message: string, mode: ChatRequest['mode']): ChatRequest {
    // Allocate on first send so empty chats do not create server history entries.
    // Keep the key if a request fails after the server has already created a chat.
    this.threadKey ??= `thread-${this.createId()}`;
    return {
      message,
      mode,
      thread_key: this.threadKey,
      ...(this.conversationId ? { conversation_id: this.conversationId } : {}),
    };
  }

  accept(event: Record<string, unknown>) {
    if (typeof event.thread_key === 'string' && event.thread_key.trim()) this.threadKey = event.thread_key;
    if (typeof event.conversation_id === 'string' && event.conversation_id.trim()) this.conversationId = event.conversation_id;
  }
}
