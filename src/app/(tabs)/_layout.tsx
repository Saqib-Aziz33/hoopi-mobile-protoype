import { Redirect, Tabs, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { C } from '@/components/ui';
import { useAuth } from '@/context/auth';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { chat: 'chatbubble-ellipses-outline', work: 'sparkles-outline', knowledge: 'book-outline', files: 'folder-outline', settings: 'person-circle-outline' };
export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.forest} /></View>;
  if (!user) return <Redirect href={'/login' as Href} />;
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: C.forest, tabBarInactiveTintColor: '#849087', tabBarStyle: { backgroundColor: '#FFFEFA', borderTopColor: '#E6E8DF', height: 62, paddingTop: 7, paddingBottom: 6 }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? 'ellipse-outline'} color={String(color)} size={size} /> })}>
    <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
    <Tabs.Screen name="work" options={{ title: 'Work' }} />
    <Tabs.Screen name="knowledge" options={{ title: 'Knowledge' }} />
    <Tabs.Screen name="files" options={{ title: 'Files' }} />
    <Tabs.Screen name="settings" options={{ title: 'You' }} />
  </Tabs>;
}
