import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { outputsApi, type OutputItem } from '@/lib/api';
import { C, Card, EmptyState, Heading, Screen, SectionTitle } from '@/components/ui';

const statusLabel: Record<string, string> = { completed: 'Ready', success: 'Ready', running: 'In progress', pending: 'Queued', failed: 'Needs attention', awaiting_approval: 'Needs approval' };
const fetchItems = async () => (await outputsApi.list()).runs;

export default function WorkScreen() {
  const router = useRouter(); const { data: runs, loading, refreshing, error, load } = useWorkspaceResource<OutputItem[]>(fetchItems, []);

  const active = runs.filter(r => ['running', 'pending', 'awaiting_approval'].includes(r.status)).length;
  const ready = runs.filter(r => ['completed', 'success'].includes(r.status)).length;
  return <Screen><Heading title="Work" subtitle="Your AI work, in motion" action={<Pressable onPress={() => router.push('/(tabs)/chat?mode=work' as Href)} style={{ flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: C.primary, minHeight: 42, borderRadius: 14, paddingHorizontal: 13 }}><Ionicons name="add" size={21} color="white" /><Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>New task</Text></Pressable>} />
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}><Card style={{ flex: 1, padding: 14, backgroundColor: C.lavender, borderColor: '#E5DEFF' }}><Text style={{ color: C.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>In progress</Text><Text style={{ color: C.ink, fontSize: 28, fontWeight: '700', marginTop: 5 }}>{active}</Text></Card><Card style={{ flex: 1, padding: 14, backgroundColor: C.blueTint, borderColor: '#D9EDFF' }}><Text style={{ color: C.blue, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Completed</Text><Text style={{ color: C.ink, fontSize: 28, fontWeight: '700', marginTop: 5 }}>{ready}</Text></Card></View>
    <SectionTitle>Recent activity</SectionTitle>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : <FlatList data={runs} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ gap: 10, paddingBottom: 24, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="◌" title="Your work will show up here" message="Ask Hoopi to handle a task. You can check its progress and results from this screen." />} renderItem={({ item }) => {
      const status = statusLabel[item.status] ?? item.status.replaceAll('_', ' ');
      const color = ['failed', 'awaiting_approval'].includes(item.status) ? C.coral : ['completed', 'success'].includes(item.status) ? C.blue : C.amber;
      return <Card style={{ padding: 15 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} /><Text style={{ color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{status}</Text><Text style={{ color: '#9299AF', fontSize: 11, marginLeft: 'auto' }}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></View><Text numberOfLines={2} style={{ color: C.ink, fontSize: 15, lineHeight: 21, fontWeight: '600' }}>{item.prompt}</Text>{item.result_summary ? <Text numberOfLines={3} style={{ color: C.moss, fontSize: 13, lineHeight: 19, marginTop: 7 }}>{item.result_summary}</Text> : item.error ? <Text style={{ color: C.coral, fontSize: 13, marginTop: 7 }}>{item.error}</Text> : null}</Card>;
    }} />}
  </Screen>;
}
