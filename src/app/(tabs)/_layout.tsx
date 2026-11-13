import { Redirect, Tabs, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { C } from '@/components/ui';
import { useAuth } from '@/context/auth';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { chat: 'chatbubble-ellipses-outline', work: 'sparkles-outline', knowledge: 'book-outline', files: 'folder-outline', settings: 'person-circle-outline' };

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  const scale = useDerivedValue(() => withSpring(focused ? 1 : 0.94, { damping: 16, stiffness: 240 }));
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[animatedStyle, { width: 44, height: 28, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name={name} color={focused ? C.primary : C.moss} size={22} /></Animated.View>;
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.primary} /></View>;
  if (!user) return <Redirect href={'/login' as Href} />;
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: C.primary,
    tabBarInactiveTintColor: C.moss,
    tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E9EBF5', height: 76, paddingTop: 6, paddingBottom: 5 },
    tabBarItemStyle: { paddingTop: 1 },
    tabBarIconStyle: { marginBottom: 3 },
    tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontWeight: '600', marginTop: 2 },
    tabBarIcon: ({ focused }) => <TabIcon name={icons[route.name] ?? 'ellipse-outline'} focused={focused} />,
  })}>
    <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
    <Tabs.Screen name="work" options={{ title: 'Work' }} />
    <Tabs.Screen name="knowledge" options={{ title: 'Knowledge' }} />
    <Tabs.Screen name="files" options={{ title: 'Files' }} />
    <Tabs.Screen name="settings" options={{ title: 'You' }} />
  </Tabs>;
}
