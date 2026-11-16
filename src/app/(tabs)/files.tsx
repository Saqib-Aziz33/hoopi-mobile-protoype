import { LibrarySearch } from '@/components/library-search';
import { ResourceRow, ListLoading } from '@/components/resource-row';
import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import React, { useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { filesApi, type FileItem } from '@/lib/api';
import { C, EmptyState, Heading, IconButton, Screen, SectionTitle } from '@/components/ui';

function sizeLabel(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
const fetchItems = filesApi.list;

export default function FilesScreen() {
  const { data: files, loading, refreshing, error, load } = useWorkspaceResource<FileItem[]>(fetchItems, []); const [uploading, setUploading] = useState(false);

  const add = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false, copyToCacheDirectory: true }); if (picked.canceled || !picked.assets.length) return;
    const file = picked.assets[0]; setUploading(true);
    try { await filesApi.upload(file.uri, file.name, file.mimeType); Alert.alert('Upload complete', `${file.name} is now in your files.`); await load(true); }
    catch (e) { Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setUploading(false); }
  };
  const download = async (file: FileItem) => { try { const { download_url } = await filesApi.downloadUrl(file.blob_path); await Linking.openURL(download_url); } catch (e) { Alert.alert('Could not open file', e instanceof Error ? e.message : 'Please try again.'); } };
  const [query, setQuery] = useState('');
  const visibleFiles = files.filter(file => file.name.toLowerCase().includes(query.trim().toLowerCase()));
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return <Screen><Heading title="Files" subtitle="Uploads and finished work" action={<IconButton name="cloud-upload-outline" accessibilityLabel="Upload a file" onPress={add} disabled={uploading} />} />
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 18 }}><Text style={{ color: C.primary, fontSize: 36, fontWeight: '300', fontVariant: ['tabular-nums'] }}>{loading ? '—' : files.length}</Text><Text style={{ color: C.moss, fontSize: 12, flex: 1 }}>files in this workspace</Text><Text style={{ color: C.moss, fontSize: 11 }}>{sizeLabel(totalSize)}</Text></View>
    <LibrarySearch value={query} onChange={setQuery} placeholder="Find a file" />
    <SectionTitle>{query ? `${visibleFiles.length} matching files` : 'All files'}</SectionTitle>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ListLoading /> : <FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" data={visibleFiles} keyExtractor={item => item.blob_path} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="▤" title={query ? "No matching files" : "No files yet"} message={query ? "Try a different filename." : "Upload a file or find documents created by Hoopi here."} />} renderItem={({ item }) => <ResourceRow title={item.name} subtitle={`${item.type === 'generated' ? 'Created by Hoopi' : 'Uploaded'} · ${sizeLabel(item.size)}`} icon={item.type === 'generated' ? 'sparkles-outline' : 'document-outline'} generated={item.type === 'generated'} onPress={() => download(item)} />} />}
  </Screen>;
}
