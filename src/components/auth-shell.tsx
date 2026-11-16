import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandMark } from '@/components/brand-mark';
import { C, Screen } from '@/components/ui';
import type { PropsWithChildren } from 'react';

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return <Screen style={{ paddingHorizontal: 24 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior="padding"><ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 36 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 }}><BrandMark size={38} /><Text style={{ color: C.ink, fontSize: 22, letterSpacing: -0.7, fontWeight: '700' }}>Hoopi</Text></View>
    <LinearGradient colors={[C.primary, C.blue, C.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 44, height: 4, borderRadius: 2, marginBottom: 20 }} />
    <Text style={{ color: C.ink, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.2 }}>{title}</Text>
    <Text style={{ color: C.moss, fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 30 }}>{subtitle}</Text>
    {children}
    <View style={{ alignItems: 'center', marginTop: 32 }}><Text style={{ color: C.moss, fontSize: 11 }}>Your ideas. Your workspace. A little more possible.</Text></View>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
