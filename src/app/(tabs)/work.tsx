import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import { ListLoading } from '@/components/resource-row';
import { outputsApi, type OutputItem } from '@/lib/api';
import { C, EmptyState, Heading, Screen } from '@/components/ui';

const statusLabel: Record<string, string> = { completed: 'Completed', success: 'Completed', running: 'In progress', pending: 'Queued', failed: 'Needs attention', awaiting_approval: 'Needs approval' };
const fetchItems = async () => (await outputsApi.list()).runs;

export default function WorkScreen() {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const router = useRouter();
  const { data: runs, loading, refreshing, error, load } = useWorkspaceResource<OutputItem[]>(fetchItems, []);
  const active = runs.filter(run => ['running', 'pending', 'awaiting_approval'].includes(run.status)).length;
  const ready = runs.filter(run => ['completed', 'success'].includes(run.status)).length;
  const visibleRuns = runs.filter(run => filter === 'all' || (filter === 'done' ? ['completed', 'success'].includes(run.status) : ['running', 'pending', 'awaiting_approval'].includes(run.status)));
  return <Screen>
    <Heading title="Work" subtitle="Recent tasks and results" action={<Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/chat?mode=work' as Href)} style={({ pressed }) => ({ flexDirection: 'row', gap: 5, alignItems: 'center', opacity: pressed ? 0.75 : 1, backgroundColor: C.primary, minHeight: 44, borderRadius: 9, paddingHorizontal: 13 })}><Ionicons name="add" size={20} color={C.white} /><Text style={{ color: C.white, fontSize: 13, fontWeight: '600' }}>New task</Text></Pressable>} />
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', paddingVertical: 20, marginBottom: 24 }}>
      <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: C.line }}><Text style={{ color: C.primary, fontSize: 36, fontWeight: '300' }}>{loading ? '—' : active}</Text><Text style={{ color: C.moss, fontSize: 12, marginTop: 5 }}>In progress</Text></View>
      <View style={{ flex: 1, paddingLeft: 24 }}><Text style={{ color: C.blue, fontSize: 36, fontWeight: '300' }}>{loading ? '—' : ready}</Text><Text style={{ color: C.moss, fontSize: 12, marginTop: 5 }}>Completed</Text></View>
    </View>
    <View style={{ flexDirection: 'row', gap: 22, marginBottom: 4 }}>{(['all', 'active', 'done'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={{ minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: filter === value ? C.primary : 'transparent' }}><Text style={{ color: filter === value ? C.primary : C.moss, fontSize: 13 }}>{value === 'all' ? 'All activity' : value === 'active' ? 'In progress' : 'Completed'}</Text></Pressable>)}</View>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ListLoading /> : <FlatList data={visibleRuns} showsVerticalScrollIndicator={false} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="✦" title={filter === 'all' ? "Nothing on the record yet" : "No tasks in this view"} message="Start a task with Hoopi. Its progress and results will appear here." />} renderItem={({ item }) => {
      const completed = ['completed', 'success'].includes(item.status);
      const color = item.status === 'failed' ? C.red : item.status === 'awaiting_approval' ? C.amber : completed ? C.blue : C.primary;
      return <View style={{ paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', gap: 14 }}><View style={{ paddingTop: 2 }}><Ionicons name={completed ? 'checkmark-circle-outline' : item.status === 'failed' ? 'alert-circle-outline' : 'ellipse-outline'} size={19} color={color} /></View><View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 }}><Text style={{ color, fontSize: 10, fontWeight: '700' }}>{statusLabel[item.status] ?? item.status.replaceAll('_', ' ')}</Text></View>
          <Text style={{ color: C.moss, fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
        </View>
        <Text numberOfLines={3} style={{ color: C.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>{item.prompt}</Text>
        {item.result_summary ? <Text numberOfLines={3} style={{ color: C.moss, fontSize: 13, lineHeight: 20, marginTop: 9 }}>{item.result_summary}</Text> : item.error ? <Text style={{ color: C.red, fontSize: 13, lineHeight: 20, marginTop: 9 }}>{item.error}</Text> : null}
      </View></View>;
    }} />}
  </Screen>;
}
