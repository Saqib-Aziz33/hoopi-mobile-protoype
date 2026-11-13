import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Redirect, Link, type Href } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Button, C, Field, Screen } from '@/components/ui';

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Redirect href={'/(tabs)/chat' as Href} />;
  const submit = async () => {
    if (!email.trim() || !password) { Alert.alert('Missing details', 'Enter your email and password to continue.'); return; }
    setBusy(true); try { await signIn(email.trim(), password); } catch (e) { Alert.alert('Could not sign in', e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  };
  return <Screen style={{ paddingHorizontal: 24 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
    <Image source={require('@/assets/images/hoopi-mark.png')} style={{ width: 58, height: 58, borderRadius: 20, marginBottom: 24 }} />
    <Text style={{ color: C.ink, fontSize: 34, fontWeight: '700', letterSpacing: -1 }}>Welcome back</Text>
    <Text style={{ color: C.moss, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 30 }}>Sign in to your Hoopi workspace and pick up where you left off.</Text>
    <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Email</Text><Field autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@company.com" value={email} onChangeText={setEmail} />
    <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700', marginTop: 18, marginBottom: 8 }}>Password</Text><Field autoComplete="password" secureTextEntry placeholder="Your password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
    <Button title="Sign in" onPress={submit} busy={busy} style={{ marginTop: 24 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22 }}><Text style={{ color: C.moss }}>New to Hoopi? </Text><Link href={'/register' as Href} style={{ color: C.primary, fontWeight: '700' }}>Create an account</Link></View>
    <Text style={{ textAlign: 'center', color: C.moss, fontSize: 11, marginTop: 36 }}>Your workspace is encrypted and securely connected.</Text>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
