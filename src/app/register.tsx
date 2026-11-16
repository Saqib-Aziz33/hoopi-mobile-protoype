import { AuthShell } from '@/components/auth-shell';
import { PasswordField } from '@/components/password-field';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link, Redirect, type Href } from 'expo-router';
import { useAuth } from '@/context/auth';
import { authApi } from '@/lib/api';
import { Button, C, Field } from '@/components/ui';

export default function RegisterScreen() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Redirect href={'/(tabs)/chat' as Href} />;
  const submit = async () => {
    if (busy) return;
    if (!name.trim() || !email.trim() || password.length < 8) { Alert.alert('Check your details', 'Add your name, a valid email, and a password with at least 8 characters.'); return; }
    setBusy(true); try { await authApi.register(email.trim(), password, name.trim()); await authApi.login(email.trim(), password); await refresh(); }
    catch (e) { Alert.alert('Could not create account', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <AuthShell title={'Make room for\nbetter work.'} subtitle={'Create your Hoopi account and bring your ideas, documents, and work together.'}>
    <Text style={{ color: C.ink, fontWeight: '700', marginBottom: 7 }}>Full name</Text><Field autoComplete="name" placeholder="Your name" value={name} onChangeText={setName} />
    <Text style={{ color: C.ink, fontWeight: '700', marginTop: 16, marginBottom: 7 }}>Email</Text><Field autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@company.com" value={email} onChangeText={setEmail} />
    <Text style={{ color: C.ink, fontWeight: '700', marginTop: 16, marginBottom: 7 }}>Password</Text><PasswordField autoComplete="new-password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} />
    <Button title="Create account" onPress={submit} busy={busy} style={{ marginTop: 24 }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 20 }}><Text style={{ color: C.moss }}>Already have an account? </Text><Link href={'/login' as Href} style={{ color: C.primary, fontWeight: '700' }}>Sign in</Link></View>
  </AuthShell>;
}
