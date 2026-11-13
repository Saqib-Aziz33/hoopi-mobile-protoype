import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link, Redirect, type Href } from 'expo-router';
import { useAuth } from '@/context/auth';
import { authApi } from '@/lib/api';
import { Button, C, Field, Screen } from '@/components/ui';

export default function RegisterScreen() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Redirect href={'/(tabs)/chat' as Href} />;
  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) { Alert.alert('Check your details', 'Add your name, a valid email, and a password with at least 8 characters.'); return; }
    setBusy(true); try { await authApi.register(email.trim(), password, name.trim()); await authApi.login(email.trim(), password); await refresh(); }
    catch (e) { Alert.alert('Could not create account', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <Screen style={{ paddingHorizontal: 24 }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 28 }} keyboardShouldPersistTaps="handled">
    <Image source={require('@/assets/images/hoopi-mark.png')} style={{ width: 54, height: 54, borderRadius: 18, marginBottom: 20 }} />
    <Text style={{ color: C.ink, fontSize: 32, fontWeight: '700' }}>Create your account</Text><Text style={{ color: C.moss, marginTop: 8, marginBottom: 26, fontSize: 15 }}>Set up your personal Hoopi workspace.</Text>
    <Text style={{ color: C.ink, fontWeight: '700', marginBottom: 7 }}>Full name</Text><Field autoComplete="name" placeholder="Your name" value={name} onChangeText={setName} />
    <Text style={{ color: C.ink, fontWeight: '700', marginTop: 16, marginBottom: 7 }}>Email</Text><Field autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@company.com" value={email} onChangeText={setEmail} />
    <Text style={{ color: C.ink, fontWeight: '700', marginTop: 16, marginBottom: 7 }}>Password</Text><Field secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} />
    <Button title="Create account" onPress={submit} busy={busy} style={{ marginTop: 24 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}><Text style={{ color: C.moss }}>Already have an account? </Text><Link href={'/login' as Href} style={{ color: C.forest, fontWeight: '700' }}>Sign in</Link></View>
  </ScrollView></KeyboardAvoidingView></Screen>;
}
