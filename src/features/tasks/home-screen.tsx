import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, editorialFont } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useTaskAction, useTaskQuery, useTaskWorkspace } from "./provider";
import { attentionItems } from "./model";
import {
  Action,
  Busy,
  Chip,
  ChoiceSheet,
  Empty,
  Failure,
  Page,
  Sheet,
  TaskIconButton,
  TaskInput,
  s,
  showError,
} from "./ui";

export function TasksHomeScreen() {
  const router = useRouter();
  const context = useTaskWorkspace();
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const boards = useTaskQuery(["boards", archived], (client) =>
    client.boards.list(archived),
  );
  const attention = useTaskQuery(
    ["attention"],
    (client) => client.tasks.attention(),
    true,
    boards.isSuccess,
  );
  const action = useTaskAction();
  const starterFor = useRef<number | null>(null);
  const [starterError, setStarterError] = useState<Error | null>(null);
  const openBoard = (id: number) =>
    router.push(`/(tabs)/tasks/board/${id}` as Href);
  // Match the web's first-visit sample board. A workspace with archived boards returns 409.
  useEffect(() => {
    const id = context.workspace?.id;
    if (
      !id ||
      archived ||
      !boards.isSuccess ||
      boards.data.length ||
      starterFor.current === id
    )
      return;
    starterFor.current = id;
    void action
      .run((client) => client.boards.createStarter())
      .then((board) => openBoard(board.id))
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 409))
          setStarterError(error);
      });
    // The attempt is guarded by workspace, not by mutation observer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.workspace?.id, archived, boards.isSuccess, boards.data?.length]);
  const requests = attentionItems(attention.data);
  const all = boards.data ?? [];
  const visible = all.filter(
    (board) =>
      board.is_archived === archived &&
      `${board.name} ${board.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const open = all
    .filter((board) => !board.is_archived)
    .reduce((total, board) => total + board.open_task_count, 0);
  return (
    <Page
      title="Tasks"
      subtitle={context.workspace?.name ?? "Your workspace"}
      back={false}
      actions={
        <>
          <TaskIconButton
            icon="business-outline"
            label="Switch workspace"
            onPress={() => setWorkspaceOpen(true)}
          />
          <TaskIconButton
            icon="add"
            label="Create board"
            onPress={() => setCreateOpen(true)}
          />
        </>
      }
    >
      {context.loading && !context.workspace ? (
        <Busy />
      ) : context.error ? (
        <Failure error={new Error(context.error)} retry={context.refresh} />
      ) : !context.workspace ? (
        <Empty
          title="No workspace available"
          message="Join or create a workspace to use Tasks."
        />
      ) : (
        <>
          <FlatList
            data={visible}
            keyExtractor={(board) => String(board.id)}
            contentContainerStyle={{
              padding: 22,
              gap: 14,
              paddingBottom: 32,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={boards.isRefetching}
                onRefresh={() => {
                  void boards.refetch();
                  void attention.refetch();
                }}
                tintColor={C.primary}
              />
            }
            ListHeaderComponent={
              <View style={{ gap: 18, marginBottom: 8 }}>
                <View
                  style={[
                    s.card,
                    { backgroundColor: C.primary, borderWidth: 0, padding: 22 },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: editorialFont,
                      fontSize: 29,
                      lineHeight: 38,
                      color: C.white,
                    }}
                  >
                    Make room for what’s next.
                  </Text>
                  <View style={{ flexDirection: "row", gap: 26, marginTop: 6 }}>
                    {[
                      [open, "Open tasks"],
                      [attention.data?.running_now ?? 0, "Agents working"],
                      [requests.length, "Need you"],
                    ].map(([value, label]) => (
                      <View key={label}>
                        <Text
                          style={{
                            color: C.white,
                            fontSize: 25,
                            fontFamily: editorialFont,
                          }}
                        >
                          {value}
                        </Text>
                        <Text
                          style={{
                            color: C.white,
                            opacity: 0.75,
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Action
                      title="Plan with AI"
                      secondary
                      onPress={() => router.push("/(tabs)/tasks/plan" as Href)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Action
                      title="Templates"
                      secondary
                      onPress={() =>
                        router.push("/(tabs)/tasks/templates" as Href)
                      }
                    />
                  </View>
                </View>
                <AttentionList boardId={undefined} />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={s.section}>Your boards</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push("/(tabs)/tasks/activity" as Href)
                    }
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text style={{ color: C.primary, fontSize: 12 }}>
                      Work activity ↗
                    </Text>
                  </Pressable>
                </View>
                <TaskInput
                  label="Find a board"
                  placeholder="Search your boards…"
                  value={search}
                  onChangeText={setSearch}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Chip
                    label="Active"
                    selected={!archived}
                    onPress={() => setArchived(false)}
                  />
                  <Chip
                    label="Archived"
                    selected={archived}
                    onPress={() => setArchived(true)}
                  />
                </View>
                {starterError ? (
                  <Failure
                    error={starterError}
                    retry={() => {
                      starterFor.current = null;
                      setStarterError(null);
                      void boards.refetch();
                    }}
                  />
                ) : null}
                {boards.isError ? (
                  <Failure
                    error={boards.error}
                    retry={() => {
                      void boards.refetch();
                    }}
                  />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              boards.isPending ? (
                <Busy />
              ) : boards.isError ? undefined : (
                <View style={{ gap: 16 }}>
                  <Empty
                    title={
                      search
                        ? "No matching boards"
                        : archived
                          ? "No archived boards"
                          : "A fresh place to begin."
                    }
                    message={
                      search
                        ? "Try a different search."
                        : "Create a board, choose a template, or describe your project to Hoopi."
                    }
                  />
                  {!search && !archived ? (
                    <Action
                      title="Create a board"
                      onPress={() => setCreateOpen(true)}
                    />
                  ) : null}
                </View>
              )
            }
            renderItem={({ item: board }) => {
              const completed = Math.max(
                0,
                board.task_count - board.open_task_count,
              );
              const waiting = requests.filter(
                (row) => row.boardId === board.id,
              ).length;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${board.name}, ${board.open_task_count} open tasks`}
                  onPress={() => openBoard(board.id)}
                  style={({ pressed }) => [
                    s.card,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: C.lavender,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="albums-outline"
                        color={C.primary}
                        size={20}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: editorialFont,
                        fontSize: 20,
                        color: C.ink,
                        flex: 1,
                      }}
                    >
                      {board.name}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={C.muted}
                    />
                  </View>
                  {board.description ? (
                    <Text numberOfLines={2} style={s.hint}>
                      {board.description}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      height: 3,
                      backgroundColor: C.line,
                      borderRadius: 2,
                    }}
                  >
                    <View
                      style={{
                        width: `${board.task_count ? (completed / board.task_count) * 100 : 0}%`,
                        height: 3,
                        backgroundColor: C.primary,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={s.hint}>
                      {board.open_task_count} open · {board.task_count} tasks
                    </Text>
                    {waiting ? (
                      <Text style={{ color: C.amber, fontSize: 12 }}>
                        {waiting} need you
                      </Text>
                    ) : (
                      <Text style={s.hint}>{board.column_count} statuses</Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        </>
      )}
      {workspaceOpen ? (
        <ChoiceSheet
          title="Your workspaces"
          choices={context.spaces.map((space) => ({
            value: String(space.id),
            label: space.name,
          }))}
          initial={context.workspace ? [String(context.workspace.id)] : []}
          onClose={() => setWorkspaceOpen(false)}
          onDone={(values) => {
            setWorkspaceOpen(false);
            void context.switchWorkspace(Number(values[0])).catch(showError);
          }}
        />
      ) : null}
      {createOpen ? (
        <Sheet
          title="A new board"
          busy={action.busy}
          onClose={() => setCreateOpen(false)}
        >
          <TaskInput
            label="Board name"
            value={name}
            onChangeText={setName}
            maxLength={200}
            placeholder="A project, a team, a fresh idea…"
          />
          <TaskInput
            label="Description"
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={5000}
          />
          <Action
            title="Create board"
            busy={action.busy}
            disabled={!name.trim()}
            onPress={() => {
              void action
                .run((client) =>
                  client.boards.create({
                    name: name.trim(),
                    description: description.trim(),
                  }),
                )
                .then((board) => {
                  setCreateOpen(false);
                  setName("");
                  setDescription("");
                  openBoard(board.id);
                })
                .catch(showError);
            }}
          />
        </Sheet>
      ) : null}
    </Page>
  );
}

export function AttentionList({ boardId }: { boardId?: number }) {
  const router = useRouter();
  const query = useTaskQuery(
    ["attention"],
    (client) => client.tasks.attention(),
    true,
  );
  const rows = attentionItems(query.data, boardId);
  const [expanded, setExpanded] = useState(false);
  if (query.isError)
    return (
      <Failure
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  if (!rows.length) return null;
  return (
    <View style={[s.card, { backgroundColor: C.peach }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={{
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
          minHeight: 44,
        }}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={23}
          color={C.amber}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.ink, fontWeight: "600" }}>
            Waiting for you · {rows.length}
          </Text>
          <Text style={s.hint}>
            Questions, permissions, and results to review.
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={C.moss}
        />
      </Pressable>
      {expanded
        ? rows.map((row) => (
            <Pressable
              key={row.taskId}
              accessibilityRole="button"
              onPress={() =>
                router.push(`/(tabs)/tasks/task/${row.taskId}` as Href)
              }
              style={{
                borderTopWidth: 1,
                borderTopColor: C.line,
                paddingTop: 12,
                minHeight: 54,
              }}
            >
              <Text style={{ color: C.ink, fontWeight: "600" }}>
                {row.title}
              </Text>
              <Text style={s.hint}>
                {[
                  row.input ? `${row.input} questions` : "",
                  row.approval ? `${row.approval} permissions` : "",
                  row.review ? "Results ready" : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                →
              </Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}
