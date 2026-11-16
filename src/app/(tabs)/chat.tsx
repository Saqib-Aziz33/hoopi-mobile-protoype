import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { conversationsApi, streamChat, workspacesApi, getWorkspaceId, setWorkspace, type Conversation, type Workspace } from '@/lib/api';
import { C, EmptyState, Field, IconButton, Screen } from '@/components/ui';
import { ChatModeSwitch } from '@/components/chat-mode-switch';
import { ChatMessage } from '@/components/chat-message';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]); const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'chat' | 'work'>('chat'); const [conversationId, setConversationId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false); const [history, setHistory] = useState<Conversation[]>([]); const [historyLoading, setHistoryLoading] = useState(false);
  const [spaces, setSpaces] = useState<Workspace[]>([]); const [activeSpace, setActiveSpace] = useState<Workspace | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const params = useLocalSearchParams<{ mode?: string }>();

  const loadSpaces = useCallback(async () => {
    try {
      const values = await workspacesApi.list(); setSpaces(values);
      if (values.length) {
        const savedId = await getWorkspaceId();
        const selected = values.find(w => w.id === savedId) ?? values[0];
        setActiveSpace(selected);
        if (savedId !== selected.id) await setWorkspace(selected.id);
      }
    } catch { /* auth or network state is handled by surrounding app */ }
  }, []);
  useFocusEffect(useCallback(() => { void loadSpaces(); }, [loadSpaces]));
  React.useEffect(() => { if (params.mode === 'work') setMode('work'); }, [params.mode]);

  async function openHistory() {
    setHistoryOpen(true); setHistoryLoading(true);
    try { setHistory((await conversationsApi.list()).conversations); } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  }
  async function selectConversation(item: Conversation) {
    setHistoryOpen(false); setBusy(false);
    try {
      const detail = await conversationsApi.get(item.id);
      setConversationId(detail.conversation.id);
      setMessages(detail.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ id: String(m.id), role: m.role as 'user' | 'assistant', content: m.content })));
    } catch { setMessages([]); }
  }
  function newChat() { setConversationId(undefined); setMessages([]); setText(''); setHistoryOpen(false); }
  async function send() {
    const prompt = text.trim(); if (!prompt || busy) return;
    setText(''); setBusy(true);
    const userMessage: Message = { id: `${Date.now()}-u`, role: 'user', content: prompt };
    const assistant: Message = { id: `${Date.now()}-a`, role: 'assistant', content: '' };
    setMessages(current => [...current, userMessage, assistant]);
    try {
      await streamChat({ message: prompt, mode, ...(conversationId ? { conversation_id: conversationId } : {}) }, event => {
        if (event.type === 'token' && typeof event.content === 'string') setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: m.content + event.content } : m));
        if (event.type === 'done' && typeof event.conversation_id === 'string') setConversationId(event.conversation_id);
        if (event.type === 'error') setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: String(event.message ?? 'Something went wrong.') } : m));
      });
    } catch (e) { setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: e instanceof Error ? e.message : 'Could not send message.' } : m)); }
    finally { setBusy(false); }
  }

  return <Screen style={{ paddingHorizontal: 0 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10, borderBottomColor: C.line, borderBottomWidth: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={openHistory} style={{ width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper, borderColor: C.line, borderWidth: 1 }}><Ionicons name="time-outline" size={21} color={C.ink} /></Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Image source={require('@/assets/images/hoopi-mark.png')} style={{ width: 25, height: 25, borderRadius: 8 }} /><Text style={{ color: C.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>Hoopi</Text></View><Pressable onPress={async () => { if (spaces.length > 1) { const i = spaces.findIndex(w => w.id === activeSpace?.id); const next = spaces[(i + 1) % spaces.length]; setActiveSpace(next); await setWorkspace(next.id); } }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.cyan }} /><Text numberOfLines={1} style={{ maxWidth: 170, color: C.moss, fontSize: 11 }}>{activeSpace?.name ?? 'Your workspace'}{spaces.length > 1 ? '  ▾' : ''}</Text></Pressable></View>
        <IconButton name="add" accessibilityLabel="Start a new chat" onPress={newChat} />
      </View>
      <ChatModeSwitch value={mode} onChange={setMode} />
    </View>
    {historyOpen ? <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 16 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><Text style={{ color: C.ink, fontSize: 19, fontWeight: '700' }}>Recent chats</Text><Pressable onPress={() => setHistoryOpen(false)}><Text style={{ color: C.blue, fontWeight: '700' }}>Close</Text></Pressable></View>{historyLoading ? <ActivityIndicator color={C.primary} /> : <FlatList data={history} keyExtractor={item => item.id} renderItem={({ item }) => <Pressable onPress={() => selectConversation(item)} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.line }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 15, fontWeight: '600' }}>{item.title || 'New conversation'}</Text><Text style={{ color: C.moss, fontSize: 12, marginTop: 4 }}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Conversation'}</Text></Pressable>} ListEmptyComponent={<EmptyState title="No conversations yet" message="Your conversations will appear here." />} />}</View> : <>
      <FlatList ref={listRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 18, flexGrow: 1, gap: 14 }} data={messages} keyExtractor={m => m.id} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} ListEmptyComponent={<View style={{ flex: 1, justifyContent: 'center', paddingBottom: 30 }}><EmptyState icon="✦" title={mode === 'chat' ? 'What can I help with?' : 'What should we get done?'} message={mode === 'chat' ? 'Ask a question, brainstorm an idea, or get help with your work.' : 'Tell Hoopi what you need done. It can work with your connected tools and keep you updated.'} /><View style={{ gap: 8, marginTop: -10 }}>{['Summarize my latest updates', 'Help me plan this week', 'Draft a message for me'].map(s => <Pressable key={s} onPress={() => setText(s)} style={{ backgroundColor: C.paper, borderColor: C.line, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12 }}><Text style={{ color: C.ink, fontSize: 13 }}>{s}  <Text style={{ color: C.blue }}>↗</Text></Text></Pressable>)}</View></View>} renderItem={({ item }) => <ChatMessage role={item.role} content={item.content} busy={busy} />} />
      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, backgroundColor: C.canvas }}><View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 20, padding: 6, shadowColor: C.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 3 }}><Field multiline placeholder={mode === 'chat' ? 'Message Hoopi…' : 'Tell Hoopi what to do…'} value={text} onChangeText={setText} style={{ flex: 1, height: 'auto', minHeight: 40, maxHeight: 120, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 9 }} onSubmitEditing={send} /><Pressable onPress={send} disabled={busy || !text.trim()} style={{ width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: busy || !text.trim() ? '#C5CAE0' : C.primary }}>{!busy && text.trim() ? <LinearGradient colors={['#4816FB', '#2559FB', '#02BDFC']} style={{ position: 'absolute', inset: 0 }} /> : null}<Ionicons name="arrow-up" size={22} color="white" /></Pressable></View><Text style={{ color: C.moss, fontSize: 10, textAlign: 'center', paddingTop: 5 }}>Hoopi may make mistakes. Check important details.</Text></View>
    </>}
  </KeyboardAvoidingView></Screen>;
}
