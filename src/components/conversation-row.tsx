import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Conversation } from '@/lib/api';
import { C } from '@/components/ui';

export function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const date = conversation.updated_at ? new Date(conversation.updated_at) : null;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? C.lavender : C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 15, minHeight: 80, marginBottom: 10 })}>
    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chatbubble-ellipses-outline" size={18} color={C.primary} /></View>
    <View style={{ flex: 1 }}><Text numberOfLines={2} style={{ color: C.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>{conversation.title || 'New conversation'}</Text><Text style={{ color: C.moss, fontSize: 11, marginTop: 5 }}>{date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Conversation'}</Text></View>
    <Ionicons name="chevron-forward" size={16} color={C.moss} />
  </Pressable>;
}
