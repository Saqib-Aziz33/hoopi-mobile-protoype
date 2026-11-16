import { ResourceRow, ListLoading } from '@/components/resource-row';
import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { knowledgeApi, type KnowledgeUpload } from '@/lib/api';
import { Button, C, EmptyState, Heading, IconButton, Screen, SectionTitle } from '@/components/ui';

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
  const indexed = uploads.filter(item => item.status === 'completed').length;
  return <Screen><Heading title="Knowledge" subtitle={`${indexed} of ${uploads.length} documents indexed`} action={<IconButton name="add" accessibilityLabel="Add a knowledge document" onPress={addFile} disabled={uploading} />} />
    <LinearGradient colors={[C.lavender, '#EEF5FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E3DEFA', marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="sparkles-outline" color={C.primary} size={20} /></View><Text style={{ color: C.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 }}>A LITTLE MORE CONTEXT</Text></View>
      <Text style={{ color: C.ink, fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.6, marginTop: 16 }}>Better answers start here.</Text>
      <Text style={{ color: C.moss, fontSize: 14, lineHeight: 21, marginTop: 8 }}>Give Hoopi the documents that matter to you. Keep your knowledge close and your answers in context.</Text>
      <Button title={uploading ? 'Adding document…' : 'Add a document'} onPress={addFile} busy={uploading} style={{ marginTop: 20 }} />
      <Text style={{ color: C.moss, fontSize: 11, textAlign: 'center', marginTop: 10 }}>PDF, Word, and PowerPoint</Text>
    </LinearGradient>
    <SectionTitle>Documents</SectionTitle>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ListLoading /> : <FlatList data={uploads} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ gap: 9, paddingBottom: 20, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="▤" title="No documents added yet" message="Add a PDF, Word document, or presentation to give Hoopi useful context." />} renderItem={({ item }) => {
      const state = item.status === 'completed' ? 'Indexed' : item.status === 'indexing' ? 'Indexing' : item.status === 'failed' ? 'Needs attention' : 'Uploaded';
      return <ResourceRow title={item.file_name} subtitle={`${state} · ${(item.file_size / 1024 / 1024).toFixed(1)} MB`} icon="document-text-outline" status={item.status === 'completed' ? 'ready' : item.status === 'failed' ? 'failed' : 'pending'} />;
    }} />}
  </Screen>;
}
