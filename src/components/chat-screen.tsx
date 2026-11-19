import { useVoiceMode } from '@/hooks/use-voice-mode';
import { VoiceModeButton, VoiceModePanel, VoiceModeError } from '@/components/voice-mode-panel';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { VoiceInputButton, VoiceInputStatus } from '@/components/voice-input-controls';
import { useReadAloud } from '@/hooks/use-read-aloud';
import { ErrorNotice } from '@/components/error-notice';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { randomUUID } from 'expo-crypto';
import { ChatSession } from '@/lib/chat-session';
import { ChatWelcome } from '@/components/chat-welcome';
import { BrandMark } from '@/components/brand-mark';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { conversationsApi, streamChat, workspacesApi, getWorkspaceId, setWorkspace, type Workspace } from '@/lib/api';
import { C, Field, IconButton, Screen } from '@/components/ui';
import { ChatModeSwitch } from '@/components/chat-mode-switch';
import { ChatMessage } from '@/components/chat-message';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
export default function ChatScreen({ savedConversationId }: { savedConversationId?: string }) {
  const router = useRouter();
  const { readingMessageId, readAloud, stopReading } = useReadAloud();
  const [messages, setMessages] = useState<Message[]>([]); const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'chat' | 'work'>('chat');
  const [chatSession] = useState(() => new ChatSession(randomUUID));
  const [spaces, setSpaces] = useState<Workspace[]>([]); const [activeSpace, setActiveSpace] = useState<Workspace | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const spaceVersion = useRef(0);
  const chatWorkspace = useRef<number | null>(null);
  const requestVersion = useRef(0);
  const streamController = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const followLatest = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(Boolean(savedConversationId));
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const inputDisabled = busy || conversationLoading || !!conversationError;
  const voice = useVoiceInput(text, setText, stopReading, inputDisabled);
  const { cancel: cancelVoice, clearError: clearVoiceError } = voice;
  const beforeVoiceCall = useCallback(async () => { cancelVoice(); clearVoiceError(); Keyboard.dismiss(); await stopReading(); }, [cancelVoice, clearVoiceError, stopReading]);
  const liveVoice = useVoiceMode(activeSpace?.id, beforeVoiceCall, inputDisabled);
  const { stop: stopVoiceCall, clear: clearVoiceCall } = liveVoice;
  // Inverted data starts at the latest message without measuring and jumping
  // through a transcript. Keep the underlying message state chronological.
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  function followMessages() {
    if (followLatest.current) listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }
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
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }
  const params = useLocalSearchParams<{ mode?: string; startNew?: string }>();

  const resetChat = useCallback(() => { stopVoiceCall(); clearVoiceCall(); cancelVoice(); clearVoiceError(); void stopReading(); cancelRequest(); followLatest.current = true; setShowLatest(false); chatSession.reset(); setConversationError(null); setMessages([]); setText(''); }, [cancelRequest, chatSession, stopReading, cancelVoice, clearVoiceError, stopVoiceCall, clearVoiceCall]);

  const newChat = useCallback(() => {
    stopVoiceCall(); clearVoiceCall();
    if (savedConversationId) {
      router.dismissTo({ pathname: '/(tabs)/chat', params: { startNew: randomUUID() } } as Href);
    } else resetChat();
  }, [savedConversationId, router, resetChat, stopVoiceCall, clearVoiceCall]);
  React.useEffect(() => {
    if (!savedConversationId && params.startNew) {
      resetChat();
      router.setParams({ startNew: undefined });
    }
  }, [savedConversationId, params.startNew, resetChat, router]);

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

  function openHistory() {
    router.push('/(tabs)/chat/history' as Href);
  }
  React.useEffect(() => {
    if (!savedConversationId) return;
    cancelRequest();
    let active = true;
    const version = requestVersion.current;
    setConversationLoading(true);
    setConversationError(null);
    followLatest.current = true;
    setShowLatest(false);
    void (async () => {
      try {
        const detail = await conversationsApi.get(savedConversationId);
        if (!active || version !== requestVersion.current) return;
        chatSession.restore(detail.conversation);
        setMessages(detail.messages.filter(message => message.role === 'user' || message.role === 'assistant').map(message => ({ id: String(message.id), role: message.role as Message['role'], content: message.content })));
      } catch (error) {
        if (active && version === requestVersion.current) setConversationError(error instanceof Error ? error.message : 'Please try again.');
      } finally {
        if (active && version === requestVersion.current) setConversationLoading(false);
      }
    })();
    return () => { active = false; };
  }, [savedConversationId, loadAttempt, cancelRequest, chatSession]);

  async function send() {
    const prompt = text.trim(); if (!prompt || sending.current || conversationLoading || conversationError || voice.active || liveVoice.active) return;
    sending.current = true;
    const version = ++requestVersion.current;
    const controller = new AbortController(); streamController.current = controller;
    followLatest.current = true; setShowLatest(false);
    setText(''); setBusy(true);
    const userMessage: Message = { id: `${Date.now()}-u`, role: 'user', content: prompt };
    const assistant: Message = { id: `${Date.now()}-a`, role: 'assistant', content: '' };
    setMessages(current => [...current, userMessage, assistant]);
    try {
      await streamChat(chatSession.request(prompt, mode), event => {
        if (version !== requestVersion.current) return;
        if (event.type === 'token' && typeof event.content === 'string') setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: m.content + event.content } : m));
        chatSession.accept(event);
        if (event.type === 'error') setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: String(event.message ?? 'Something went wrong.') } : m));
      }, controller.signal);
    } catch (e) { if (version !== requestVersion.current || controller.signal.aborted) return; setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: e instanceof Error ? e.message : 'Could not send message.' } : m)); }
    finally { if (version === requestVersion.current) { sending.current = false; setBusy(false); streamController.current = null; } }
  }

  return <Screen animate={false} style={{ paddingHorizontal: 0 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" automaticOffset>
    <View style={{ paddingHorizontal: 24, paddingTop: 10, borderBottomColor: C.line, borderBottomWidth: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {savedConversationId ? <Pressable accessibilityRole="button" accessibilityLabel="Go back to recent chats" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="arrow-back" size={22} color={C.ink} /></Pressable> : null}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><BrandMark size={28} /><Text style={{ color: C.ink, fontSize: 21, fontWeight: '600', letterSpacing: -0.8 }}>Hoopi</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch workspace" disabled={spaces.length < 2} onPress={async () => { if (spaces.length > 1) { const i = spaces.findIndex(w => w.id === activeSpace?.id); const next = spaces[(i + 1) % spaces.length]; try { stopVoiceCall(); await setWorkspace(next.id); newChat(); chatWorkspace.current = next.id; setActiveSpace(next); } catch { Alert.alert('Could not switch workspace', 'Please try again.'); } } }} style={{ minHeight: 32, flexDirection: 'row', gap: 5, alignItems: 'center' }}><Text numberOfLines={1} style={{ maxWidth: 190, color: C.moss, fontSize: 11 }}>{activeSpace?.name ?? 'Your workspace'}</Text>{spaces.length > 1 ? <Ionicons name="chevron-down" size={11} color={C.moss} /> : null}</Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open recent chats" onPress={openHistory} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="time-outline" size={22} color={C.ink} /></Pressable>
        <IconButton name="add" accessibilityLabel="Start a new chat" onPress={newChat} />
      </View>
      <ChatModeSwitch value={mode} onChange={value => { if (!liveVoice.active) setMode(value); }} />
    </View>
    {liveVoice.active ? <VoiceModePanel state={liveVoice} onStop={liveVoice.stop} onMute={liveVoice.toggleMuted} /> : <>
      <VoiceModeError error={liveVoice.error} onDismiss={liveVoice.clear} />
      <View style={{ flex: 1 }}>
      {conversationError ? <View style={{ padding: 24 }}><ErrorNotice message={conversationError} onRetry={() => setLoadAttempt(attempt => attempt + 1)} /></View> : null}
      {!conversationError && conversationLoading ? <View accessibilityLabel="Opening conversation" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.primary} /><Text style={{ color: C.moss, fontSize: 13, marginTop: 12 }}>Opening conversation…</Text></View> : null}
      {!conversationLoading && !conversationError ? <FlatList ref={listRef} style={{ flex: 1 }} inverted={messages.length > 0} maintainVisibleContentPosition={{ minIndexForVisible: 0 }} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 20, flexGrow: 1, gap: 20 }} data={newestFirst} keyExtractor={m => m.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" scrollEventThrottle={100} onScroll={({ nativeEvent: { contentOffset } }) => { const nearEnd = contentOffset.y < 100; followLatest.current = nearEnd; setShowLatest(!nearEnd); }} onContentSizeChange={followMessages} ListEmptyComponent={<ChatWelcome work={mode === 'work'} onSelect={prompt => { voice.cancel(); setText(prompt); }} />} renderItem={({ item }) => <ChatMessage role={item.role} content={item.content} busy={busy} reading={readingMessageId === item.id} readAloudDisabled={voice.active} onReadAloud={item.role === 'assistant' && !(busy && item.id === messages[messages.length - 1]?.id) ? () => { void readAloud(item.id, item.content); } : undefined} />} /> : null}
      </View>
      {showLatest ? <Pressable accessibilityRole="button" accessibilityLabel="Scroll to latest message" onPress={scrollToLatest} style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 10, borderRadius: 20, backgroundColor: C.lavender }}><Ionicons name="arrow-down" size={16} color={C.primary} /><Text style={{ color: C.primary, fontWeight: '600', fontSize: 12 }}>Latest messages</Text></Pressable> : null}
      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, backgroundColor: C.canvas }}>
        <View style={{ backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 7 }}>
          <Field editable={!conversationLoading && !conversationError && !voice.active} multiline placeholder={mode === 'chat' ? 'Message Hoopi…' : 'Tell Hoopi what to do…'} value={text} onChangeText={setText} style={{ height: 'auto', minHeight: 44, maxHeight: 120, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 9 }} onSubmitEditing={send} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <VoiceInputButton status={voice.status} disabled={inputDisabled} onPress={() => { if (!voice.active) Keyboard.dismiss(); voice.toggle(); }} />
            {liveVoice.configured ? <VoiceModeButton disabled={inputDisabled} onPress={liveVoice.start} /> : null}
            <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send message" disabled={inputDisabled || voice.active || !text.trim()} style={{ width: 42, height: 42, borderRadius: 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: inputDisabled || voice.active || !text.trim() ? C.lavender : C.primary }}><Ionicons name="arrow-up" size={21} color={inputDisabled || voice.active || !text.trim() ? C.primary : C.white} /></Pressable>
          </View>
        </View>
        <VoiceInputStatus status={voice.status} error={voice.error} onCancel={voice.cancel} onDismiss={voice.clearError} />
        <Text style={{ color: C.moss, fontSize: 10, textAlign: 'center', paddingTop: 5 }}>AI can make mistakes. Check important details.</Text>
      </View>
    </>}
  </KeyboardAvoidingView></Screen>;
}
