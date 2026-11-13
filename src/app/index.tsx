import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/auth';
import { C } from '@/components/ui';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.canvas }}><ActivityIndicator color={C.forest} /></View>;
  return <Redirect href={(user ? '/(tabs)/chat' : '/login') as Href} />;
}
