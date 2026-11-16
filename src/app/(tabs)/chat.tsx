import { ConversationRow } from '@/components/conversation-row';
import { ChatWelcome } from '@/components/chat-welcome';
import { BrandMark } from '@/components/brand-mark';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Pressable, Text, View } from 'react-native';
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
  const spaceVersion = useRef(0);
  const chatWorkspace = useRef<number | null>(null);
  const requestVersion = useRef(0);
  const streamController = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const followLatest = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  React.useEffect(() => () => { requestVersion.current++; streamController.current?.abort(); }, []);
  const cancelRequest = useCallback(() => {
    requestVersion.current++;
    streamController.current?.abort();
    sending.current = false;
    setBusy(false);
    setConversationLoading(false);
  }, []);
  function scrollToLatest() {
    followLatest.current = true;
    setShowLatest(false);
    listRef.current?.scrollToEnd({ animated: true });
  }
  const params = useLocalSearchParams<{ mode?: string }>();

  const newChat = useCallback(() => { cancelRequest(); followLatest.current = true; setShowLatest(false); setConversationId(undefined); setMessages([]); setText(''); setHistoryOpen(false); setHistory([]); }, [cancelRequest]);

  const loadSpaces = useCallback(async () => {
    const version = ++spaceVersion.current;
    try {
      const values = await workspacesApi.list();
      if (version !== spaceVersion.current) return;
      setSpaces(values);
      if (values.length) {
        const savedId = await getWorkspaceId();
        const selected = values.find(w => w.id === savedId) ?? values[0];
        if (version !== spaceVersion.current) return;
        if (savedId !== selected.id) await setWorkspace(selected.id);
        if (version !== spaceVersion.current) return;
        if (chatWorkspace.current !== null && chatWorkspace.current !== selected.id) newChat();
        chatWorkspace.current = selected.id;
        setActiveSpace(selected);
      }
    } catch { /* auth or network state is handled by surrounding app */ }
  }, [newChat]);
  useFocusEffect(useCallback(() => { void loadSpaces(); return () => { spaceVersion.current++; }; }, [loadSpaces]));
  React.useEffect(() => { if (params.mode === 'work') setMode('work'); }, [params.mode]);

  async function openHistory() {
    const workspace = chatWorkspace.current;
    setHistoryOpen(true); setHistoryLoading(true);
    try { const result = await conversationsApi.list(); if (workspace === chatWorkspace.current) setHistory(result.conversations); } catch (error) { if (workspace === chatWorkspace.current) Alert.alert('Could not load recent chats', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setHistoryLoading(false); }
  }
  async function selectConversation(item: Conversation) {
    cancelRequest();
    const version = requestVersion.current;
    setHistoryOpen(false); setConversationLoading(true);
    followLatest.current = true; setShowLatest(false); setText('');
    try {
      const detail = await conversationsApi.get(item.id);
      if (version !== requestVersion.current) return;
      setConversationId(detail.conversation.id);
      setMessages(detail.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ id: String(m.id), role: m.role as 'user' | 'assistant', content: m.content })));
    } catch (error) { if (version === requestVersion.current) Alert.alert('Could not open chat', error instanceof Error ? error.message : 'Please try again.'); }
    finally { if (version === requestVersion.current) setConversationLoading(false); }
  }

  async function send() {
    const prompt = text.trim(); if (!prompt || sending.current || conversationLoading) return;
    sending.current = true;
    const version = ++requestVersion.current;
    const controller = new AbortController(); streamController.current = controller;
    followLatest.current = true; setShowLatest(false);
    setText(''); setBusy(true);
    const userMessage: Message = { id: `${Date.now()}-u`, role: 'user', content: prompt };
    const assistant: Message = { id: `${Date.now()}-a`, role: 'assistant', content: '' };
    setMessages(current => [...current, userMessage, assistant]);
    try {
      await streamChat({ message: prompt, mode, ...(conversationId ? { conversation_id: conversationId } : {}) }, event => {
        if (version !== requestVersion.current) return;
        if (event.type === 'token' && typeof event.content === 'string') setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: m.content + event.content } : m));
        if (event.type === 'done' && typeof event.conversation_id === 'string') setConversationId(event.conversation_id);
        if (event.type === 'error') setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: String(event.message ?? 'Something went wrong.') } : m));
      }, controller.signal);
    } catch (e) { if (version !== requestVersion.current || controller.signal.aborted) return; setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: e instanceof Error ? e.message : 'Could not send message.' } : m)); }
    finally { if (version === requestVersion.current) { sending.current = false; setBusy(false); streamController.current = null; } }
  }

  return <Screen style={{ paddingHorizontal: 0 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, borderBottomColor: C.line, borderBottomWidth: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open recent chats" onPress={openHistory} style={{ width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper, borderColor: C.line, borderWidth: 1 }}><Ionicons name="time-outline" size={21} color={C.ink} /></Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><BrandMark size={30} /><Text style={{ color: C.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>Hoopi</Text></View><Pressable onPress={async () => { if (spaces.length > 1) { const i = spaces.findIndex(w => w.id === activeSpace?.id); const next = spaces[(i + 1) % spaces.length]; await setWorkspace(next.id); newChat(); chatWorkspace.current = next.id; setActiveSpace(next); } }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.cyan }} /><Text numberOfLines={1} style={{ maxWidth: 170, color: C.moss, fontSize: 11 }}>{activeSpace?.name ?? 'Your workspace'}{spaces.length > 1 ? '  ▾' : ''}</Text></Pressable></View>
        <IconButton name="add" accessibilityLabel="Start a new chat" onPress={newChat} />
      </View>
      <ChatModeSwitch value={mode} onChange={setMode} />
    </View>
    {historyOpen ? <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 16 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><Text style={{ color: C.ink, fontSize: 24, letterSpacing: -0.7, fontWeight: '700' }}>Recent chats</Text><Pressable accessibilityRole="button" accessibilityLabel="Close recent chats" onPress={() => setHistoryOpen(false)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}><Text style={{ color: C.blue, fontWeight: '700' }}>Close</Text></Pressable></View>{historyLoading ? <ActivityIndicator color={C.primary} /> : <FlatList data={history} keyExtractor={item => item.id} renderItem={({ item }) => <ConversationRow conversation={item} onPress={() => selectConversation(item)} />} ListEmptyComponent={<EmptyState title="No conversations yet" message="Your conversations will appear here." />} />}</View> : <>
      {conversationLoading ? <ActivityIndicator color={C.primary} style={{ padding: 12 }} /> : null}
      <FlatList ref={listRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 20, flexGrow: 1, gap: 20 }} data={messages} keyExtractor={m => m.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" scrollEventThrottle={100} onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => { const nearEnd = contentSize.height - layoutMeasurement.height - contentOffset.y < 100; followLatest.current = nearEnd; setShowLatest(!nearEnd); }} onContentSizeChange={() => { if (followLatest.current) listRef.current?.scrollToEnd({ animated: false }); }} ListEmptyComponent={<ChatWelcome work={mode === 'work'} onSelect={setText} />} renderItem={({ item }) => <ChatMessage role={item.role} content={item.content} busy={busy} />} />
      {showLatest ? <Pressable accessibilityRole="button" accessibilityLabel="Scroll to latest message" onPress={scrollToLatest} style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 10, borderRadius: 20, backgroundColor: C.lavender }}><Ionicons name="arrow-down" size={16} color={C.primary} /><Text style={{ color: C.primary, fontWeight: '600', fontSize: 12 }}>Latest messages</Text></Pressable> : null}
      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, backgroundColor: C.canvas }}><View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 24, padding: 7, shadowColor: C.ink, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}><Field multiline placeholder={mode === 'chat' ? 'Message Hoopi…' : 'Tell Hoopi what to do…'} value={text} onChangeText={setText} style={{ flex: 1, height: 'auto', minHeight: 40, maxHeight: 120, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 9 }} onSubmitEditing={send} /><Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send message" disabled={busy || conversationLoading || !text.trim()} style={{ width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: busy || !text.trim() ? C.lavender : C.primary }}>{!busy && text.trim() ? <LinearGradient colors={['#4816FB', '#2559FB', '#02BDFC']} style={{ position: 'absolute', inset: 0 }} /> : null}<Ionicons name="arrow-up" size={21} color={busy || !text.trim() ? C.primary : C.white} /></Pressable></View><Text style={{ color: C.moss, fontSize: 10, textAlign: 'center', paddingTop: 5 }}>AI can make mistakes. Check important details.</Text></View>
    </>}
  </KeyboardAvoidingView></Screen>;
}
