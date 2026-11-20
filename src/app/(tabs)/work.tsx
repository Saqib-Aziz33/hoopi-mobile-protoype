import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EditorialBloom } from "@/components/editorial-bloom";
import { useWorkspaceResource } from "@/hooks/use-workspace-resource";
import { ErrorNotice } from "@/components/error-notice";
import { ListLoading } from "@/components/resource-row";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { outputsApi, type OutputItem } from "@/lib/api";
import {
  C,
  Button,
  Card,
  EmptyState,
  Heading,
  IconButton,
  Screen,
  SegmentedControl,
  SectionTitle,
  StatusBadge,
} from "@/components/ui";

const statusLabel: Record<string, string> = {
  completed: "Completed",
  success: "Completed",
  running: "In progress",
  pending: "Queued",
  failed: "Needs attention",
  awaiting_approval: "Needs approval",
};
const fetchItems = async () => (await outputsApi.list()).runs;

export default function WorkScreen() {
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const router = useRouter();
  const {
    data: runs,
    loading,
    refreshing,
    error,
    load,
  } = useWorkspaceResource<OutputItem[]>(fetchItems, []);
  const active = runs.filter((run) =>
    ["running", "pending", "awaiting_approval"].includes(run.status),
  ).length;
  const ready = runs.filter((run) =>
    ["completed", "success"].includes(run.status),
  ).length;
  const visibleRuns = runs.filter(
    (run) =>
      filter === "all" ||
      (filter === "done"
        ? ["completed", "success"].includes(run.status)
        : ["running", "pending", "awaiting_approval"].includes(run.status)),
  );
  const startTask = () => router.push("/(tabs)/chat?mode=work" as Href);
  return (
    <Screen>
      <Heading
        title="Work"
        subtitle="Your tasks, from start to finish."
        action={
          <IconButton
            name="add"
            accessibilityLabel="Start a new task"
            onPress={startTask}
          />
        }
      />
      <Card className="relative overflow-hidden border-0 bg-primary-500 px-6 py-5">
        <Box
          pointerEvents="none"
          className="absolute -right-5 -top-5 opacity-30"
        >
          <EditorialBloom size={135} muted />
        </Box>
        <Text className="font-editorial text-[27px] leading-9 text-white">
          In good hands.
        </Text>
        <Box className="mt-6 flex-row items-center gap-6">
          <Box className="flex-1">
            <Text className="font-editorial text-[38px] leading-[46px] text-white">
              {loading ? "—" : active}
            </Text>
            <Text className="mt-1 text-[10px] uppercase tracking-[1.3px] text-white/70">
              In progress
            </Text>
          </Box>
          <Box className="h-12 w-px bg-white/20" />
          <Box className="flex-1">
            <Text className="font-editorial text-[38px] leading-[46px] text-white">
              {loading ? "—" : ready}
            </Text>
            <Text className="mt-1 text-[10px] uppercase tracking-[1.3px] text-white/70">
              Completed
            </Text>
          </Box>
        </Box>
      </Card>
      <SectionTitle>Your activity</SectionTitle>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All tasks" },
          { value: "active", label: "In progress" },
          { value: "done", label: "Completed" },
        ]}
      />
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
          data={visibleRuns}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={
            error ? undefined : (
              <EmptyState
                icon="checkmark-done-outline"
                title={
                  filter === "all"
                    ? "A little less on your list."
                    : "All clear for now."
                }
                message={
                  filter === "all"
                    ? "Leave the research, planning, or first draft with Hoopi. Follow its progress here."
                    : "Tasks with this status will appear here."
                }
                action={
                  filter === "all" ? (
                    <Button
                      title="Start a task"
                      icon="add"
                      onPress={startTask}
                    />
                  ) : undefined
                }
              />
            )
          }
          renderItem={({ item }) => {
            const completed = ["completed", "success"].includes(item.status);
            const tone =
              item.status === "failed"
                ? "error"
                : item.status === "awaiting_approval"
                  ? "warning"
                  : completed
                    ? "success"
                    : "primary";
            return (
              <Box className="flex-row gap-3.5 border-b border-outline-200 py-5">
                <Box
                  className="mt-1 h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: completed
                      ? C.greenTint
                      : item.status === "failed"
                        ? "#F7E7E3"
                        : C.lavender,
                  }}
                >
                  <Ionicons
                    name={
                      completed
                        ? "checkmark"
                        : item.status === "failed"
                          ? "close"
                          : "time-outline"
                    }
                    size={15}
                    color={
                      completed
                        ? C.green
                        : item.status === "failed"
                          ? C.red
                          : C.primary
                    }
                  />
                </Box>
                <Box className="flex-1">
                  <Box className="mb-2.5 flex-row items-center justify-between gap-2">
                    <StatusBadge tone={tone}>
                      {statusLabel[item.status] ??
                        item.status.replaceAll("_", " ")}
                    </StatusBadge>
                    <Text className="text-[10px] text-typography-600">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </Box>
                  <Text
                    numberOfLines={3}
                    className="font-editorial text-[17px] leading-[24px] text-typography-950"
                  >
                    {item.prompt}
                  </Text>
                  {item.result_summary ? (
                    <Text
                      numberOfLines={2}
                      className="mt-2 text-xs leading-[19px] text-typography-600"
                    >
                      {item.result_summary}
                    </Text>
                  ) : item.error ? (
                    <Text
                      className="mt-2 text-xs leading-[19px]"
                      style={{ color: C.red }}
                    >
                      {item.error}
                    </Text>
                  ) : null}
                </Box>
              </Box>
            );
          }}
        />
      )}
    </Screen>
  );
}
