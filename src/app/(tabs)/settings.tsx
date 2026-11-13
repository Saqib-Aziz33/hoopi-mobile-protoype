import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, type AlertButton } from 'react-native';
import { Redirect, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { getWorkspaceId, setWorkspace, workspacesApi, type Workspace } from '@/lib/api';
import { C, Card, Heading, Screen, SectionTitle } from '@/components/ui';

function Row({ icon, title, subtitle, onPress, trailing }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; trailing?: React.ReactNode }) {
  return <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 62, gap: 12, paddingVertical: 8 }}><View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={19} color={C.forest} /></View><View style={{ flex: 1 }}><Text style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{title}</Text>{subtitle ? <Text style={{ color: C.moss, fontSize: 12, marginTop: 3 }}>{subtitle}</Text> : null}</View>{trailing ?? (onPress ? <Ionicons name="chevron-forward" size={16} color="#98A196" /> : null)}</Pressable>;
}
export default function SettingsScreen() {
  const { user, signOut } = useAuth(); const router = useRouter(); const [spaces, setSpaces] = useState<Workspace[]>([]); const [active, setActive] = useState<Workspace | null>(null);
  React.useEffect(() => {
    void (async () => {
      try {
        const values = await workspacesApi.list(); setSpaces(values);
        const savedId = await getWorkspaceId();
        const selected = values.find(w => w.id === savedId) ?? values[0] ?? null;
        setActive(selected);
        if (selected && savedId !== selected.id) await setWorkspace(selected.id);
      } catch { /* the empty state remains useful while offline */ }
    })();
  }, []);
  if (!user) return <Redirect href={'/login' as Href} />;
  const switchSpace = () => {
    if (spaces.length < 2) return;
    const buttons: AlertButton[] = spaces.map(w => ({ text: `${w.name}${w.id === active?.id ? '  ✓' : ''}`, onPress: async () => { setActive(w); await setWorkspace(w.id); } }));
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Switch workspace', 'Choose a workspace', buttons);
  };
  const confirmSignOut = () => Alert.alert('Sign out of Hoopi?', 'You can sign back in anytime.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login' as Href); } }]);
  return <Screen><ScrollView contentContainerStyle={{ paddingBottom: 24 }}><Heading title="You" subtitle="Account and workspace" />
    <Card style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 17, marginBottom: 20 }}><View style={{ width: 50, height: 50, borderRadius: 18, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>{(user.full_name || user.email).slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: C.ink, fontWeight: '700', fontSize: 16 }}>{user.full_name || user.email.split('@')[0]}</Text><Text numberOfLines={1} style={{ color: C.moss, fontSize: 12, marginTop: 4 }}>{user.email}</Text></View><View style={{ backgroundColor: C.mint, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: C.forest, fontSize: 10, fontWeight: '700' }}>ACTIVE</Text></View></Card>
    <SectionTitle>Workspace</SectionTitle><Card style={{ paddingHorizontal: 14, marginBottom: 18 }}><Row icon="business-outline" title={active?.name ?? 'Loading workspace…'} subtitle={spaces.length > 1 ? 'Tap to switch workspace' : (active?.is_personal ? 'Personal workspace' : 'Your Hoopi workspace')} onPress={switchSpace} trailing={spaces.length > 1 ? <Ionicons name="chevron-down" size={17} color="#98A196" /> : undefined} /></Card>
    <SectionTitle>Your Hoopi</SectionTitle><Card style={{ paddingHorizontal: 14, marginBottom: 18 }}><Row icon="book-outline" title="Knowledge" subtitle="Reference documents for Hoopi" onPress={() => router.push('/(tabs)/knowledge' as Href)} /><View style={{ height: 1, backgroundColor: C.line }} /><Row icon="folder-outline" title="Files" subtitle="Uploads and work created by Hoopi" onPress={() => router.push('/(tabs)/files' as Href)} /><View style={{ height: 1, backgroundColor: C.line }} /><Row icon="chatbubble-ellipses-outline" title="Ask Hoopi" subtitle="Start a chat or browse recent conversations" onPress={() => router.push('/(tabs)/chat' as Href)} /></Card>
    <SectionTitle>Account</SectionTitle><Card style={{ paddingHorizontal: 14, marginBottom: 18 }}><Row icon="shield-checkmark-outline" title="Privacy & security" subtitle="Secure connection to your workspace" /><View style={{ height: 1, backgroundColor: C.line }} /><Row icon="information-circle-outline" title="About Hoopi" subtitle="Your AI work assistant" trailing={<Text style={{ color: C.moss, fontSize: 12 }}>v1.0</Text>} /></Card>
    <Pressable onPress={confirmSignOut} style={{ height: 52, borderRadius: 16, backgroundColor: '#F5E9E5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Ionicons name="log-out-outline" size={19} color={C.red} /><Text style={{ color: C.red, fontSize: 15, fontWeight: '700' }}>Sign out</Text></Pressable>
    <Text style={{ color: '#9AA39A', fontSize: 11, textAlign: 'center', marginTop: 22 }}>Made to help you get great work done.</Text>
  </ScrollView></Screen>;
}
