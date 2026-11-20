import { ActivityIndicator, FlatList } from "react-native";
import { Box as View } from "@/components/ui/box";
import { useRouter, type Href } from "expo-router";
import { useWorkspaceResource } from "@/hooks/use-workspace-resource";
import { conversationsApi, type Conversation } from "@/lib/api";
import { ConversationRow } from "@/components/conversation-row";
import { ErrorNotice } from "@/components/error-notice";
import { C, EmptyState, SectionTitle } from "@/components/ui";

const fetchHistory = async () => (await conversationsApi.list()).conversations;

export default function HistoryScreen() {
  const router = useRouter();
  const { data, loading, error, load } = useWorkspaceResource<Conversation[]>(
    fetchHistory,
    [],
  );
  return (
    <View style={{ flex: 1, paddingHorizontal: 24, backgroundColor: C.canvas }}>
      <SectionTitle>Your conversations</SectionTitle>
      {error ? (
        <ErrorNotice
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 12,
            paddingBottom: 24,
          }}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/chat/[conversationId]",
                  params: { conversationId: item.id },
                } as Href)
              }
            />
          )}
          ListEmptyComponent={
            error ? undefined : (
              <EmptyState
                title="No conversations yet"
                message="Your conversations will appear here."
              />
            )
          }
        />
      )}
    </View>
  );
}
