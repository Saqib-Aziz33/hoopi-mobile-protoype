import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/components/ui';

export function ResourceRow({ title, subtitle, icon, generated = false, status, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; generated?: boolean; status?: 'ready' | 'pending' | 'failed'; onPress?: () => void }) {
  return <Pressable disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={onPress ? `Open ${title}` : undefined} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: 13, alignItems: 'center', minHeight: 86, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: pressed ? '#D4C7FF' : C.line, backgroundColor: pressed ? C.lavender : C.white })}>
    <View style={{ width: 44, height: 50, borderRadius: 13, backgroundColor: generated ? C.lavender : C.blueTint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={22} color={generated ? C.primary : C.blue} /></View>
    <View style={{ flex: 1, gap: 6 }}><Text numberOfLines={2} style={{ color: C.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>{title}</Text><Text style={{ color: status === 'failed' ? C.red : C.moss, fontSize: 12, lineHeight: 17 }}>{subtitle}</Text></View>
    <Ionicons name={onPress ? 'arrow-down-outline' : status === 'ready' ? 'checkmark-circle' : status === 'failed' ? 'alert-circle-outline' : 'time-outline'} size={19} color={status === 'failed' ? C.red : status === 'ready' ? C.blue : C.moss} />
  </Pressable>;
}

export function ListLoading() {
  return <View accessibilityLabel="Loading items" accessibilityState={{ busy: true }} style={{ gap: 10 }}>{[0, 1, 2].map(index => <View key={index} style={{ minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 15 }}><View style={{ width: 44, height: 50, borderRadius: 13, backgroundColor: C.lavender }} /><View style={{ flex: 1, gap: 10 }}><View style={{ height: 10, width: `${78 - index * 12}%`, backgroundColor: C.line, borderRadius: 5 }} /><View style={{ height: 8, width: '42%', backgroundColor: '#F0F2F8', borderRadius: 4 }} /></View></View>)}</View>;
}
