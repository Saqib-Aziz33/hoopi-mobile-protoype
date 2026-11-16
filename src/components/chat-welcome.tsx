import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandMark } from '@/components/brand-mark';
import { C } from '@/components/ui';

const suggestions = [
  { icon: 'sparkles-outline' as const, title: 'Catch me up', detail: 'Summarize my latest updates', color: C.primary, tint: C.lavender },
  { icon: 'calendar-outline' as const, title: 'Make a plan', detail: 'Help me plan this week', color: C.blue, tint: C.blueTint },
  { icon: 'create-outline' as const, title: 'Find the right words', detail: 'Draft a message for me', color: C.primary, tint: C.lavender },
];

export function ChatWelcome({ work, onSelect }: { work: boolean; onSelect: (prompt: string) => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 28 }}>
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <LinearGradient colors={[C.lavender, C.blueTint]} style={{ padding: 16, borderRadius: 32, marginBottom: 22 }}><BrandMark size={56} /></LinearGradient>
        <Text style={{ color: C.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>{work ? 'LET’S GET IT DONE' : 'A LITTLE HELP. A LOT POSSIBLE.'}</Text>
        <Text style={{ color: C.ink, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -1, textAlign: 'center', maxWidth: 290 }}>{work ? 'What’s on your to-do list?' : 'What’s on your mind?'}</Text>
        <Text style={{ color: C.moss, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 290, marginTop: 12 }}>{work ? 'Turn an idea into action. Tell Hoopi what you need and take it from there.' : 'A fresh idea, a clearer plan, or a helping hand. Start a conversation with Hoopi.'}</Text>
      </View>
      <View style={{ gap: 10 }}>{suggestions.map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.detail} onPress={() => onSelect(item.detail)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: pressed ? '#D4C7FF' : C.line, backgroundColor: pressed ? C.lavender : C.white })}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.tint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.icon} size={19} color={item.color} /></View>
        <View style={{ flex: 1 }}><Text style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{item.title}</Text><Text style={{ color: C.moss, fontSize: 12, marginTop: 3 }}>{item.detail}</Text></View>
        <Ionicons name="arrow-up-outline" size={17} color={C.moss} style={{ transform: [{ rotate: '45deg' }] }} />
      </Pressable>)}</View>
    </View>
  );
}
