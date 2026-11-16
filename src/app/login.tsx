import { AuthShell } from '@/components/auth-shell';
import { PasswordField } from '@/components/password-field';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Redirect, Link, type Href } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Button, C, Field } from '@/components/ui';

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Redirect href={'/(tabs)/chat' as Href} />;
  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) { Alert.alert('Missing details', 'Enter your email and password to continue.'); return; }
    setBusy(true); try { await signIn(email.trim(), password); } catch (e) { Alert.alert('Could not sign in', e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  };
  return <AuthShell title={'Welcome back.'} subtitle={'Sign in to your workspace. Your conversations, knowledge, and ideas are right here.'}>
    <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Email</Text><Field autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@company.com" value={email} onChangeText={setEmail} />
    <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700', marginTop: 18, marginBottom: 8 }}>Password</Text><PasswordField autoComplete="password" placeholder="Your password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
    <Button title="Sign in" onPress={submit} busy={busy} style={{ marginTop: 24 }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 22 }}><Text style={{ color: C.moss }}>New to Hoopi? </Text><Link href={'/register' as Href} style={{ color: C.primary, fontWeight: '700' }}>Create an account</Link></View>
  </AuthShell>;
}
