import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, Field } from '@/components/ui';

export function LibrarySearch({ value, onChange, placeholder = 'Find a document' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 10 }}>
    <Ionicons name="search-outline" size={18} color={C.moss} />
    <Field accessibilityLabel={placeholder} value={value} onChangeText={onChange} placeholder={placeholder} autoCorrect={false} autoCapitalize="none" returnKeyType="search" style={{ flex: 1, minHeight: 48, borderWidth: 0, backgroundColor: 'transparent', fontSize: 14, paddingHorizontal: 10 }} />
    {value ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange('')} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="close" size={18} color={C.moss} /></Pressable> : null}
  </View>;
}
