import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { knowledgeApi, type KnowledgeUpload } from '@/lib/api';
import { Button, C, Card, EmptyState, Heading, Screen, SectionTitle } from '@/components/ui';

export default function KnowledgeScreen() {
  const [uploads, setUploads] = useState<KnowledgeUpload[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [uploading, setUploading] = useState(false);
  const load = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); try { setUploads((await knowledgeApi.list()).uploads); } catch { setUploads([]); } finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const addFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets.length) return;
    const file = picked.assets[0]; setUploading(true);
    try { await knowledgeApi.upload(file.uri, file.name, file.mimeType); Alert.alert('Added to Knowledge', 'Hoopi is indexing your document now.'); await load(true); }
    catch (e) { Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setUploading(false); }
  };
  const indexed = uploads.filter(item => item.status === 'completed').length;
  return <Screen><Heading title="Knowledge" subtitle={`${indexed} of ${uploads.length} documents indexed`} action={<Pressable onPress={addFile} disabled={uploading} style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.forest }}><Ionicons name="add" color="white" size={24} /></Pressable>} />
    <Card style={{ backgroundColor: C.forest, borderColor: C.forest, padding: 19, marginBottom: 19 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="sparkles" color="white" size={19} /></View><Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>Your knowledge, ready to use</Text></View><Text style={{ color: '#E1EBE2', fontSize: 13, lineHeight: 19, marginTop: 12 }}>Add reference files so Hoopi can answer with the context that matters to you.</Text><Button title={uploading ? 'Adding document…' : 'Add a document'} onPress={addFile} busy={uploading} secondary style={{ alignSelf: 'flex-start', marginTop: 16, minHeight: 40 }} /></Card>
    <SectionTitle>Documents</SectionTitle>
    {loading ? <ActivityIndicator color={C.forest} style={{ marginTop: 30 }} /> : <FlatList data={uploads} keyExtractor={item => String(item.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.forest} />} contentContainerStyle={{ gap: 9, paddingBottom: 20, flexGrow: 1 }} ListEmptyComponent={<EmptyState icon="▤" title="No documents added yet" message="Add a PDF, Word document, or presentation to give Hoopi useful context." />} renderItem={({ item }) => {
      const state = item.status === 'completed' ? 'Indexed' : item.status === 'indexing' ? 'Indexing' : item.status === 'failed' ? 'Needs attention' : 'Uploaded';
      return <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="document-text-outline" size={20} color={C.forest} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: C.ink, fontSize: 14, fontWeight: '600' }}>{item.file_name}</Text><Text style={{ color: item.status === 'failed' ? C.coral : C.moss, fontSize: 12, marginTop: 5 }}>{state} · {(item.file_size / 1024 / 1024).toFixed(1)} MB</Text></View><Ionicons name={item.status === 'completed' ? 'checkmark-circle' : item.status === 'failed' ? 'alert-circle' : 'time-outline'} size={19} color={item.status === 'completed' ? C.leaf : item.status === 'failed' ? C.coral : '#B68D48'} /></Card>;
    }} />}
  </Screen>;
}
