import { Stack } from 'expo-router';
import { C } from '@/components/ui';

export const unstable_settings = { initialRouteName: 'index' };

export default function ChatLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true, contentStyle: { backgroundColor: C.canvas } }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="history" options={{ headerShown: true, title: 'Recent chats', headerTintColor: C.ink, headerStyle: { backgroundColor: C.canvas }, headerShadowVisible: false }} />
    <Stack.Screen name="[conversationId]" />
  </Stack>;
}
