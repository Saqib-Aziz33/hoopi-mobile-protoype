import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { C } from '@/components/ui';
import { AuthProvider } from '@/context/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.canvas } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
