import { ErrorNotice } from '@/components/error-notice';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, type AlertButton } from 'react-native';
import { Redirect, useFocusEffect, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { getWorkspaceId, setWorkspace, workspacesApi, type Workspace } from '@/lib/api';
import { C, Card, Heading, Screen, SectionTitle } from '@/components/ui';

function Row({ icon, title, subtitle, onPress, trailing }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; trailing?: React.ReactNode }) {
  return <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 72, gap: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: pressed ? C.lavender : 'transparent' })}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={19} color={C.primary} /></View><View style={{ flex: 1 }}><Text style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{title}</Text>{subtitle ? <Text style={{ color: C.moss, fontSize: 12, marginTop: 3 }}>{subtitle}</Text> : null}</View>{trailing ?? (onPress ? <Ionicons name="chevron-forward" size={16} color="#9299AF" /> : null)}</Pressable>;
}
export default function SettingsScreen() {
  const { user, signOut } = useAuth(); const router = useRouter(); const [spaces, setSpaces] = useState<Workspace[]>([]); const [active, setActive] = useState<Workspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const workspaceRequest = React.useRef(0);
  const loadWorkspace = useCallback(async () => {
    const request = ++workspaceRequest.current;
    setWorkspaceError(null);
    try {
      const values = await workspacesApi.list();
      const savedId = await getWorkspaceId();
      if (request !== workspaceRequest.current) return;
      const selected = values.find(w => w.id === savedId) ?? values[0] ?? null;
      if (selected && savedId !== selected.id) await setWorkspace(selected.id);
      if (request !== workspaceRequest.current) return;
      setSpaces(values);
      setActive(selected);
    } catch (error) {
      if (request === workspaceRequest.current) setWorkspaceError(error instanceof Error ? error.message : 'Please try again.');
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void loadWorkspace();
    return () => { workspaceRequest.current++; };
  }, [loadWorkspace]));
  if (!user) return <Redirect href={'/login' as Href} />;
  const switchSpace = () => {
    if (spaces.length < 2) return;
    const buttons: AlertButton[] = spaces.map(w => ({ text: `${w.name}${w.id === active?.id ? '  ✓' : ''}`, onPress: async () => { try { await setWorkspace(w.id); setActive(w); } catch { Alert.alert('Could not switch workspace', 'Please try again.'); } } }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Switch workspace', 'Choose a workspace', buttons);
  };
  const confirmSignOut = () => Alert.alert('Sign out of Hoopi?', 'You can sign back in anytime.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login' as Href); } }]);
  return <Screen><ScrollView contentContainerStyle={{ paddingBottom: 24 }}><Heading title="You" subtitle="Account and workspace" />
    <LinearGradient colors={[C.lavender, C.blueTint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E3DEFA', marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E4DCFF' }}><Text style={{ color: C.primary, fontSize: 23, fontWeight: '700' }}>{(user.full_name || user.email).slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: C.ink, fontWeight: '700', fontSize: 20, letterSpacing: -0.5 }}>{user.full_name || user.email.split('@')[0]}</Text><Text numberOfLines={1} style={{ color: C.moss, fontSize: 13, marginTop: 5 }}>{user.email}</Text></View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, borderTopWidth: 1, borderTopColor: '#DDDFF4', paddingTop: 14 }}><Ionicons name="business-outline" size={14} color={C.primary} /><Text numberOfLines={1} style={{ color: C.moss, fontSize: 12, flex: 1 }}>{active?.name ?? 'Your Hoopi workspace'}</Text></View>
    </LinearGradient>
    {workspaceError ? <ErrorNotice message={workspaceError} onRetry={() => { void loadWorkspace(); }} /> : null}
    <SectionTitle>Workspace</SectionTitle><Card style={{ paddingHorizontal: 14, marginBottom: 18 }}><Row icon="business-outline" title={active?.name ?? (workspaceError ? 'Workspace unavailable' : 'Loading workspace…')} subtitle={spaces.length > 1 ? 'Tap to switch workspace' : (active?.is_personal ? 'Personal workspace' : 'Your Hoopi workspace')} onPress={spaces.length > 1 ? switchSpace : undefined} trailing={spaces.length > 1 ? <Ionicons name="chevron-down" size={17} color={C.moss} /> : undefined} /></Card>
    <SectionTitle>Your Hoopi</SectionTitle><Card style={{ paddingHorizontal: 14, marginBottom: 18 }}><Row icon="book-outline" title="Knowledge" subtitle="Reference documents for Hoopi" onPress={() => router.push('/(tabs)/knowledge' as Href)} /><View style={{ height: 1, backgroundColor: C.line }} /><Row icon="folder-outline" title="Files" subtitle="Uploads and work created by Hoopi" onPress={() => router.push('/(tabs)/files' as Href)} /><View style={{ height: 1, backgroundColor: C.line }} /><Row icon="chatbubble-ellipses-outline" title="Ask Hoopi" subtitle="Start a chat or browse recent conversations" onPress={() => router.push('/(tabs)/chat' as Href)} /></Card>
    <SectionTitle>Account</SectionTitle><Card style={{ paddingHorizontal: 14, marginBottom: 18 }}><Row icon="shield-checkmark-outline" title="Privacy & security" subtitle="Secure connection to your workspace" /><View style={{ height: 1, backgroundColor: C.line }} /><Row icon="information-circle-outline" title="About Hoopi" subtitle="Your AI work assistant" trailing={<Text style={{ color: C.moss, fontSize: 12 }}>v1.0</Text>} /></Card>
    <Pressable accessibilityRole="button" onPress={confirmSignOut} style={{ height: 52, borderRadius: 16, backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: '#F5DDE5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Ionicons name="log-out-outline" size={19} color={C.red} /><Text style={{ color: C.red, fontSize: 15, fontWeight: '700' }}>Sign out</Text></Pressable>
    <Text style={{ color: '#9299AF', fontSize: 11, textAlign: 'center', marginTop: 22 }}>Made to help you get great work done.</Text>
  </ScrollView></Screen>;
}
