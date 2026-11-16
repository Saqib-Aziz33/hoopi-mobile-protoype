import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandOrbit } from '@/components/brand-orbit';
import { C, editorialFont } from '@/components/ui';

const prompts = {
  chat: ['Summarize my latest updates', 'Help me think through an idea', 'Draft a message for me'],
  work: ['Help me plan this week', 'Research a topic and write a brief', 'Turn my notes into a document'],
};

export function ChatWelcome({ work, onSelect }: { work: boolean; onSelect: (prompt: string) => void }) {
  return <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 28, paddingHorizontal: 6 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <Text style={{ color: C.moss, fontSize: 11, letterSpacing: 0.5 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
      <BrandOrbit size={66} />
    </View>
    <Text style={{ fontFamily: editorialFont, color: C.ink, fontSize: 42, lineHeight: 48, letterSpacing: -1.5 }}>{work ? 'A place to\nmove work forward.' : 'A thought.\nA starting point.'}</Text>
    <Text style={{ color: C.moss, fontSize: 15, lineHeight: 23, marginTop: 18, maxWidth: 295 }}>{work ? 'Tell Hoopi what needs doing. Follow the work and find the result here.' : 'Ask Hoopi a question, bring an idea, or pick up something you’ve been meaning to do.'}</Text>
    <View style={{ marginTop: 36 }}>
      <Text style={{ fontSize: 11, color: C.moss, marginBottom: 14 }}>A FEW PLACES TO START</Text>
      {prompts[work ? 'work' : 'chat'].map((prompt, index) => <Pressable key={prompt} accessibilityRole="button" onPress={() => onSelect(prompt)} style={({ pressed }) => ({ minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: pressed ? C.lavender : 'transparent' })}>
        <Text style={{ color: C.primary, fontSize: 11, fontVariant: ['tabular-nums'] }}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={{ flex: 1, color: C.ink, fontSize: 14, lineHeight: 21, paddingVertical: 12 }}>{prompt}</Text>
        <Ionicons name="arrow-forward" size={17} color={C.primary} />
      </Pressable>)}
    </View>
  </View>;
}
