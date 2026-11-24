import { LibrarySearch } from "@/components/library-search";
import { ResourceRow, ListLoading } from "@/components/resource-row";
import { useWorkspaceResource } from "@/hooks/use-workspace-resource";
import { ErrorNotice } from "@/components/error-notice";
import React, { useState } from "react";
import { Alert, FlatList, RefreshControl } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { knowledgeApi, type KnowledgeUpload } from "@/lib/api";
import {
  C,
  EmptyState,
  Heading,
  IconButton,
  Screen,
  SectionTitle,
  CollectionSummary,
  Button,
} from "@/components/ui";

const fetchItems = async () => (await knowledgeApi.list()).uploads;

export default function KnowledgeScreen() {
  const {
    data: uploads,
    loading,
    refreshing,
    error,
    load,
  } = useWorkspaceResource<KnowledgeUpload[]>(fetchItems, []);
  const [uploading, setUploading] = useState(false);

  const addFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets.length) return;
    const file = picked.assets[0];
    setUploading(true);
    try {
      await knowledgeApi.upload(file.uri, file.name, file.mimeType);
      Alert.alert("Added to Knowledge", "Hoopi is indexing your document now.");
      await load(true);
    } catch (e) {
      Alert.alert(
        "Upload failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };
  const [query, setQuery] = useState("");
  const visibleUploads = uploads.filter((file) =>
    file.file_name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const indexed = uploads.filter((item) => item.status === "completed").length;
  return (
    <Screen>
      <Heading
        title="Knowledge"
        subtitle="A little context goes a long way."
        action={
          <IconButton
            name="add"
            accessibilityLabel="Add a knowledge document"
            onPress={addFile}
            disabled={uploading}
            busy={uploading}
          />
        }
      />
      <CollectionSummary
        icon="book-outline"
        title="A library of your own"
        description="The notes, guides, and documents that make your answers more personal."
        count={loading ? "—" : String(indexed)}
        detail={`${uploads.length} documents · ${indexed} ready to use`}
      />
      <LibrarySearch value={query} onChange={setQuery} />
      <SectionTitle>
        {query
          ? `${visibleUploads.length} matching documents`
          : "Your documents"}
      </SectionTitle>
      {error ? (
        <ErrorNotice
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      ) : null}
      {loading ? (
        <ListLoading />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          data={visibleUploads}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={
            error ? undefined : (
              <EmptyState
                icon="▤"
                title={
                  query
                    ? "No matching documents"
                    : "A little context goes a long way"
                }
                message={
                  query
                    ? "Try a different document name."
                    : "Add your first document. Hoopi can use it to give you more useful answers."
                }
                action={
                  query ? undefined : (
                    <Button
                      title="Add a document"
                      icon="add"
                      onPress={addFile}
                      busy={uploading}
                    />
                  )
                }
              />
            )
          }
          renderItem={({ item }) => {
            const state =
              item.status === "completed"
                ? "Indexed"
                : item.status === "indexing"
                  ? "Indexing"
                  : item.status === "failed"
                    ? "Needs attention"
                    : "Uploaded";
            return (
              <ResourceRow
                title={item.file_name}
                subtitle={`${state} · ${(item.file_size / 1024 / 1024).toFixed(1)} MB`}
                icon="document-text-outline"
                status={
                  item.status === "completed"
                    ? "ready"
                    : item.status === "failed"
                      ? "failed"
                      : "pending"
                }
              />
            );
          }}
        />
      )}
    </Screen>
  );
}
