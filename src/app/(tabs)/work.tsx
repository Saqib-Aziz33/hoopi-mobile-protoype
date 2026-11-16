import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import { ListLoading } from '@/components/resource-row';
import { outputsApi, type OutputItem } from '@/lib/api';
import { C, Card, EmptyState, Heading, Screen, SectionTitle } from '@/components/ui';

const statusLabel: Record<string, string> = { completed: 'Completed', success: 'Completed', running: 'In progress', pending: 'Queued', failed: 'Needs attention', awaiting_approval: 'Needs approval' };
const fetchItems = async () => (await outputsApi.list()).runs;

function Metric({ label, value, icon, blue = false }: { label: string; value?: number; icon: keyof typeof Ionicons.glyphMap; blue?: boolean }) {
  const color = blue ? C.blue : C.primary;
  return <Card style={{ flex: 1, padding: 16, backgroundColor: blue ? '#F0F8FF' : '#F5F1FF', borderColor: blue ? '#DCEBFB' : '#E8E0FC' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Ionicons name={icon} size={19} color={color} /><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} /></View>
    <Text style={{ color: C.ink, fontSize: 32, letterSpacing: -1.2, fontWeight: '700', marginTop: 16 }}>{value ?? '—'}</Text>
    <Text style={{ color: C.moss, fontSize: 12, fontWeight: '500', marginTop: 3 }}>{label}</Text>
  </Card>;
}

export default function WorkScreen() {
  const router = useRouter();
  const { data: runs, loading, refreshing, error, load } = useWorkspaceResource<OutputItem[]>(fetchItems, []);
  const active = runs.filter(run => ['running', 'pending', 'awaiting_approval'].includes(run.status)).length;
  const ready = runs.filter(run => ['completed', 'success'].includes(run.status)).length;
  return <Screen>
    <Heading title="Work" subtitle="From an idea to a job well done" action={<Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/chat?mode=work' as Href)} style={({ pressed }) => ({ flexDirection: 'row', gap: 5, alignItems: 'center', opacity: pressed ? 0.75 : 1, backgroundColor: C.primary, minHeight: 44, borderRadius: 15, paddingHorizontal: 13 })}><Ionicons name="add" size={20} color={C.white} /><Text style={{ color: C.white, fontSize: 13, fontWeight: '600' }}>New task</Text></Pressable>} />
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}><Metric label="In progress" value={loading ? undefined : active} icon="layers-outline" /><Metric label="Completed" value={loading ? undefined : ready} icon="checkmark-done-outline" blue /></View>
    <SectionTitle>Recent activity</SectionTitle>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ListLoading /> : <FlatList data={runs} showsVerticalScrollIndicator={false} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ gap: 12, paddingBottom: 24, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="✦" title="Make room for progress" message="Give Hoopi a task. You can follow its progress and find the results right here." />} renderItem={({ item }) => {
      const completed = ['completed', 'success'].includes(item.status);
      const color = item.status === 'failed' ? C.red : item.status === 'awaiting_approval' ? C.amber : completed ? C.blue : C.primary;
      return <Card style={{ padding: 17 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${color}0D`, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8 }}><Ionicons name={completed ? 'checkmark-circle-outline' : item.status === 'failed' ? 'alert-circle-outline' : 'ellipse-outline'} size={13} color={color} /><Text style={{ color, fontSize: 10, fontWeight: '700' }}>{statusLabel[item.status] ?? item.status.replaceAll('_', ' ')}</Text></View>
          <Text style={{ color: C.moss, fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
        </View>
        <Text numberOfLines={3} style={{ color: C.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>{item.prompt}</Text>
        {item.result_summary ? <Text numberOfLines={3} style={{ color: C.moss, fontSize: 13, lineHeight: 20, marginTop: 9 }}>{item.result_summary}</Text> : item.error ? <Text style={{ color: C.red, fontSize: 13, lineHeight: 20, marginTop: 9 }}>{item.error}</Text> : null}
      </Card>;
    }} />}
  </Screen>;
}
