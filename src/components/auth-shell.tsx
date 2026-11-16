import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { BrandMark } from '@/components/brand-mark';
import { BrandCrest } from '@/components/brand-crest';
import { C, Screen, editorialFont } from '@/components/ui';
import type { PropsWithChildren } from 'react';

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return <Screen style={{ paddingHorizontal: 28 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior="padding"><ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 }}><BrandMark size={30} /><Text style={{ color: C.ink, fontSize: 21, letterSpacing: -0.7, fontWeight: '600' }}>Hoopi</Text></View>
    <View style={{ marginBottom: 24 }}><BrandCrest size={82} /></View>
    <Text style={{ color: C.ink, fontFamily: editorialFont, fontSize: 42, lineHeight: 48, letterSpacing: -1.4 }}>{title}</Text>
    <Text style={{ color: C.moss, fontSize: 15, lineHeight: 23, marginTop: 16, marginBottom: 32 }}>{subtitle}</Text>
    {children}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 36 }}><View style={{ height: 2, width: 20, backgroundColor: C.cyan }} /><Text style={{ color: C.moss, fontSize: 11 }}>A workspace for your thoughts and your work.</Text></View>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
