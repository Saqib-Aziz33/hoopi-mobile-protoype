import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/components/ui';

export function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={{ borderRadius: 16, padding: 14, marginBottom: 12, backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: '#F3D2DB' }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Ionicons name="cloud-offline-outline" size={19} color={C.red} /><Text style={{ color: C.ink, fontWeight: '700', fontSize: 14 }}>Could not load updates</Text></View>
      <Text style={{ color: C.moss, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginTop: 4 }}><Text style={{ color: C.primary, fontSize: 13, fontWeight: '700' }}>Try again</Text></Pressable>
    </View>
  );
}
