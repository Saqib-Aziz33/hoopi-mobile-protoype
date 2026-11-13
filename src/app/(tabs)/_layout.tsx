import { Redirect, Tabs, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { C } from '@/components/ui';
import { useAuth } from '@/context/auth';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { chat: 'chatbubble-ellipses-outline', work: 'sparkles-outline', knowledge: 'book-outline', files: 'folder-outline', settings: 'person-circle-outline' };
export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.primary} /></View>;
  if (!user) return <Redirect href={'/login' as Href} />;
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: C.primary,
    tabBarInactiveTintColor: C.moss,
    tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E9EBF5', height: 68, paddingTop: 7, paddingBottom: 6 },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    tabBarIcon: ({ focused, size }) => <View style={{ minWidth: 38, height: 29, paddingHorizontal: 9, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? C.primary : 'transparent' }}><Ionicons name={icons[route.name] ?? 'ellipse-outline'} color={focused ? '#FFFFFF' : C.moss} size={size} /></View>,
  })}>
    <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
    <Tabs.Screen name="work" options={{ title: 'Work' }} />
    <Tabs.Screen name="knowledge" options={{ title: 'Knowledge' }} />
    <Tabs.Screen name="files" options={{ title: 'Files' }} />
    <Tabs.Screen name="settings" options={{ title: 'You' }} />
  </Tabs>;
}
