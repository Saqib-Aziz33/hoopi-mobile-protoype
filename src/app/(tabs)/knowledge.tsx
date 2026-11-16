import { LibrarySearch } from '@/components/library-search';
import { ResourceRow, ListLoading } from '@/components/resource-row';
import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { knowledgeApi, type KnowledgeUpload } from '@/lib/api';
import { C, EmptyState, Heading, IconButton, Screen, SectionTitle } from '@/components/ui';

const fetchItems = async () => (await knowledgeApi.list()).uploads;

export default function KnowledgeScreen() {
  const { data: uploads, loading, refreshing, error, load } = useWorkspaceResource<KnowledgeUpload[]>(fetchItems, []); const [uploading, setUploading] = useState(false);

  const addFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets.length) return;
    const file = picked.assets[0]; setUploading(true);
    try { await knowledgeApi.upload(file.uri, file.name, file.mimeType); Alert.alert('Added to Knowledge', 'Hoopi is indexing your document now.'); await load(true); }
    catch (e) { Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setUploading(false); }
  };
  const [query, setQuery] = useState('');
  const visibleUploads = uploads.filter(file => file.file_name.toLowerCase().includes(query.trim().toLowerCase()));
  const indexed = uploads.filter(item => item.status === 'completed').length;
  return <Screen><Heading title="Knowledge" subtitle="The documents Hoopi can draw on" action={<IconButton name="add" accessibilityLabel="Add a knowledge document" onPress={addFile} disabled={uploading} />} />
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 20, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}><Text style={{ color: C.primary, fontSize: 36, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{loading ? '—' : indexed}</Text><Text style={{ color: C.ink, fontSize: 14 }}>documents ready</Text><Text style={{ color: C.moss, fontSize: 11, marginLeft: 'auto' }}>{uploads.length} total</Text></View>
      <Text style={{ color: C.moss, fontSize: 13, lineHeight: 20, marginTop: 10 }}>Add reference material with the + button. PDF, Word, and PowerPoint documents are supported.</Text>
    </View>
    <LibrarySearch value={query} onChange={setQuery} />
    <SectionTitle>{query ? `${visibleUploads.length} matching documents` : 'Reference shelf'}</SectionTitle>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ListLoading /> : <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" data={visibleUploads} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="▤" title={query ? "No matching documents" : "Your shelf is empty"} message={query ? "Try a different document name." : "Add a reference document to give Hoopi useful context."} />} renderItem={({ item }) => {
      const state = item.status === 'completed' ? 'Indexed' : item.status === 'indexing' ? 'Indexing' : item.status === 'failed' ? 'Needs attention' : 'Uploaded';
      return <ResourceRow title={item.file_name} subtitle={`${state} · ${(item.file_size / 1024 / 1024).toFixed(1)} MB`} icon="document-text-outline" status={item.status === 'completed' ? 'ready' : item.status === 'failed' ? 'failed' : 'pending'} />;
    }} />}
  </Screen>;
}
