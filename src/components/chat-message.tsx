import { BrandMark } from '@/components/brand-mark';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { C } from '@/components/ui';

type ChatMessageProps = {
  role: 'user' | 'assistant';
  content: string;
  busy?: boolean;
  reading?: boolean;
  readAloudDisabled?: boolean;
  onReadAloud?: () => void;
};

const markdownStyles = {
  body: { color: C.ink, fontSize: 15, lineHeight: 22 },
  paragraph: { color: C.ink, fontSize: 15, lineHeight: 22, marginTop: 0, marginBottom: 8 },
  heading1: { color: C.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' as const, marginTop: 4, marginBottom: 8 },
  heading2: { color: C.ink, fontSize: 19, lineHeight: 25, fontWeight: '700' as const, marginTop: 4, marginBottom: 7 },
  heading3: { color: C.ink, fontSize: 17, lineHeight: 23, fontWeight: '700' as const, marginTop: 3, marginBottom: 6 },
  heading4: { color: C.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
  strong: { color: C.ink, fontWeight: '700' as const },
  em: { color: C.ink, fontStyle: 'italic' as const },
  link: { color: C.blue, textDecorationLine: 'underline' as const },
  bullet_list: { marginTop: 2, marginBottom: 5 },
  ordered_list: { marginTop: 2, marginBottom: 5 },
  list_item: { marginBottom: 3 },
  bullet_list_icon: { color: C.primary },
  ordered_list_icon: { color: C.primary },
  blockquote: { backgroundColor: C.lavender, borderColor: C.primary, borderLeftWidth: 3, marginLeft: 0, paddingHorizontal: 10, paddingVertical: 4 },
  code_inline: { color: C.primary, backgroundColor: C.lavender, fontFamily: 'monospace', paddingHorizontal: 4, borderRadius: 4 },
  code_block: { color: C.ink, backgroundColor: '#F2F3FA', borderColor: C.line, fontFamily: 'monospace', fontSize: 13, lineHeight: 19, padding: 10, borderRadius: 9 },
  fence: { color: C.ink, backgroundColor: '#F2F3FA', borderColor: C.line, fontFamily: 'monospace', fontSize: 13, lineHeight: 19, padding: 10, borderRadius: 9 },
  table: { borderColor: C.line, borderWidth: 1, borderRadius: 8 },
  tr: { borderColor: C.line, borderBottomWidth: 1, flexDirection: 'row' as const },
  th: { color: C.ink, fontWeight: '700' as const, flex: 1, padding: 6 },
  td: { color: C.ink, flex: 1, padding: 6 },
};

export function ChatMessage({ role, content, busy = false, reading = false, readAloudDisabled = false, onReadAloud }: ChatMessageProps) {
  const user = role === 'user';
  return (
    <View style={{ alignSelf: user ? 'flex-end' : 'flex-start', maxWidth: user ? '88%' : '100%', width: user ? undefined : '100%' }}>
      {user ? (
        <View style={{ backgroundColor: C.lavender, borderRadius: 14, borderTopRightRadius: 4, paddingHorizontal: 16, paddingVertical: 13 }}>
          <Text selectable style={{ color: C.ink, fontSize: 15, lineHeight: 22 }}>{content}</Text>
        </View>
      ) : (
        <View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }}><BrandMark size={23} /><Text style={{ color: C.moss, fontWeight: '600', fontSize: 11 }}>Hoopi</Text></View><View style={{ paddingVertical: 4, paddingHorizontal: 2 }}>
          {content ? <Markdown style={markdownStyles}>{content}</Markdown> : busy ? <ThinkingIndicator /> : null}
        </View>{onReadAloud && content.trim() ? <Pressable accessibilityRole="button" accessibilityLabel={reading ? 'Stop reading' : 'Read aloud'} accessibilityState={{ selected: reading, disabled: readAloudDisabled }} disabled={readAloudDisabled} onPress={onReadAloud} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', opacity: readAloudDisabled ? 0.4 : 1, minHeight: 44, gap: 6, paddingHorizontal: 4 }}><Ionicons name={reading ? 'stop-circle-outline' : 'volume-medium-outline'} size={17} color={reading ? C.primary : C.moss} /><Text style={{ color: reading ? C.primary : C.moss, fontSize: 11 }}>{reading ? 'Stop reading' : 'Read aloud'}</Text></Pressable> : null}</View>
      )}
    </View>
  );
}
