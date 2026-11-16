import { useWorkspaceResource } from '@/hooks/use-workspace-resource';
import { ErrorNotice } from '@/components/error-notice';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, RefreshControl, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { filesApi, type FileItem } from '@/lib/api';
import { C, Card, EmptyState, Heading, IconButton, Screen, SectionTitle } from '@/components/ui';

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
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return <Screen><Heading title="Files" subtitle={`${files.length} files · ${sizeLabel(totalSize)} total`} action={<IconButton name="cloud-upload-outline" accessibilityLabel="Upload a file" onPress={add} disabled={uploading} />} />
    <Card style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 15, marginBottom: 18 }}><View style={{ width: 42, height: 42, backgroundColor: C.lavender, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="cloud-done-outline" color={C.primary} size={22} /></View><View style={{ flex: 1 }}><Text style={{ color: C.ink, fontWeight: '700', fontSize: 14 }}>Your workspace files</Text><Text style={{ color: C.moss, marginTop: 4, lineHeight: 18, fontSize: 12 }}>Documents Hoopi has created or files you have uploaded.</Text></View></Card>
    <SectionTitle>All files</SectionTitle>
    {error ? <ErrorNotice message={error} onRetry={() => { void load(); }} /> : null}
    {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : <FlatList data={files} keyExtractor={item => item.blob_path} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />} contentContainerStyle={{ gap: 9, paddingBottom: 20, flexGrow: 1 }} ListEmptyComponent={error ? undefined : <EmptyState icon="▤" title="No files yet" message="Upload a document or ask Hoopi to create one for you." />} renderItem={({ item }) => <Pressable onPress={() => download(item)}><Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: item.type === 'generated' ? C.blueTint : C.lavender, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.type === 'generated' ? 'sparkles-outline' : 'document-outline'} size={20} color={C.primary} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{item.name}</Text><Text style={{ color: C.moss, fontSize: 12, marginTop: 5 }}>{item.type === 'generated' ? 'Created by Hoopi' : 'Uploaded'} · {sizeLabel(item.size)}</Text></View><Ionicons name="download-outline" color={C.blue} size={20} /></Card></Pressable>} />}
  </Screen>;
}
