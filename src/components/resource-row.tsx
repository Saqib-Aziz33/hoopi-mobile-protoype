import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/components/ui';

export function ResourceRow({ title, subtitle, icon, generated = false, status, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; generated?: boolean; status?: 'ready' | 'pending' | 'failed'; onPress?: () => void }) {
  const extension = title.includes('.') ? title.split('.').pop()?.slice(0, 5).toUpperCase() : 'FILE';
  return <Pressable disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={onPress ? `Open ${title}` : undefined} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: 15, alignItems: 'center', minHeight: 88, paddingVertical: 17, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: pressed ? C.lavender : 'transparent' })}>
    <View style={{ width: 34, height: 44, borderWidth: 1, borderColor: generated ? C.primary : '#C5C7D0', borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper }}><Ionicons name={icon} size={15} color={generated ? C.primary : C.moss} /><Text style={{ fontSize: 7, letterSpacing: 0.3, fontWeight: '700', color: generated ? C.primary : C.moss, marginTop: 4 }}>{extension}</Text></View>
    <View style={{ flex: 1, gap: 6 }}><Text numberOfLines={2} style={{ color: C.ink, fontSize: 15, lineHeight: 21, fontWeight: '500' }}>{title}</Text><Text style={{ color: status === 'failed' ? C.red : C.moss, fontSize: 11, lineHeight: 17 }}>{subtitle}</Text></View>
    <Ionicons name={onPress ? 'arrow-down-outline' : status === 'ready' ? 'checkmark' : status === 'failed' ? 'alert-circle-outline' : 'time-outline'} size={17} color={status === 'failed' ? C.red : status === 'ready' ? C.blue : C.moss} />
  </Pressable>;
}

export function ListLoading() {
  return <View accessibilityLabel="Loading items" accessibilityState={{ busy: true }}>{[0, 1, 2].map(index => <View key={index} style={{ minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 17 }}><View style={{ width: 34, height: 44, borderRadius: 3, backgroundColor: '#EDEDF0' }} /><View style={{ flex: 1, gap: 10 }}><View style={{ height: 9, width: `${78 - index * 12}%`, backgroundColor: C.line, borderRadius: 2 }} /><View style={{ height: 7, width: '42%', backgroundColor: '#EDEDF0', borderRadius: 2 }} /></View></View>)}</View>;
}
