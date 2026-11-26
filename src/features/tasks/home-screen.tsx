import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
  const query = search.trim().toLowerCase();
  const visible = all.filter(
    (board) =>
      board.is_archived === archived &&
      `${board.name} ${board.description}`.toLowerCase().includes(query),
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          automaticOffset
        >
          <FlatList
            style={{ flex: 1 }}
            data={visible}
            keyExtractor={(board) => String(board.id)}
            contentContainerStyle={{
              padding: 22,
              gap: 14,
              paddingBottom: 32,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
              <View style={{ gap: 14, marginBottom: 8 }}>
                <View
                  style={[
                    s.card,
                    {
                      backgroundColor: C.primary,
                      borderWidth: 0,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "stretch",
                      gap: 12,
                    },
                  ]}
                >
                  {[
                    [open, "Open tasks"],
                    [attention.data?.running_now ?? 0, "Agents working"],
                    [requests.length, "Need you"],
                  ].map(([value, label], index) => (
                    <View
                      key={label}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: index ? 12 : 0,
                        borderLeftWidth: index ? 1 : 0,
                        borderLeftColor: "rgba(255, 253, 250, 0.2)",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: C.white,
                          fontSize: 23,
                          lineHeight: 29,
                          fontFamily: editorialFont,
                        }}
                      >
                        {value}
                      </Text>
                      <Text
                        style={{
                          color: C.white,
                          opacity: 0.85,
                          fontSize: 11,
                          lineHeight: 16,
                          marginTop: 2,
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
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
                {/* Temporarily hide the home alert; keep it ready to re-enable.
                <AttentionList boardId={undefined} />
                */}
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
                      query
                        ? "No matching boards"
                        : archived
                          ? "No archived boards"
                          : "A fresh place to begin."
                    }
                    message={
                      query
                        ? "Try a different search."
                        : "Create a board, choose a template, or describe your project to Hoopi."
                    }
                  />
                  {!query && !archived ? (
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
                Math.min(
                  board.task_count,
                  board.task_count - board.open_task_count,
                ),
              );
              const progress = board.task_count
                ? Math.round((completed / board.task_count) * 100)
                : 0;
              const waiting = requests.filter(
                (row) => row.boardId === board.id,
              ).length;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${board.name}, ${board.open_task_count} open tasks, ${progress}% complete${waiting ? `, ${waiting} need your attention` : ""}`}
                  onPress={() => openBoard(board.id)}
                  style={({ pressed }) => [
                    s.card,
                    {
                      padding: 18,
                      gap: 14,
                      borderRadius: 20,
                      backgroundColor: pressed ? C.lavender : C.paper,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        backgroundColor: archived ? C.canvas : C.lavender,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={archived ? "archive-outline" : "albums-outline"}
                        color={archived ? C.moss : C.primary}
                        size={21}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontFamily: editorialFont,
                          fontSize: 21,
                          lineHeight: 28,
                          color: C.ink,
                        }}
                      >
                        {board.name}
                      </Text>
                      <Text
                        style={{ color: C.moss, fontSize: 11, lineHeight: 16 }}
                      >
                        {archived ? "Archived board · " : ""}
                        {board.column_count}{" "}
                        {board.column_count === 1 ? "status" : "statuses"}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={C.primary}
                      style={{ marginTop: 5 }}
                    />
                  </View>
                  {board.description ? (
                    <Text
                      numberOfLines={2}
                      style={{ color: C.moss, fontSize: 13, lineHeight: 20 }}
                    >
                      {board.description}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      paddingTop: 12,
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{ color: C.moss, fontSize: 12, lineHeight: 20 }}
                      >
                        <Text
                          style={{
                            color: C.ink,
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          {board.open_task_count} open
                        </Text>{" "}
                        · {board.task_count} total
                      </Text>
                      {waiting ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: C.peach,
                          }}
                        >
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={13}
                            color={C.amber}
                          />
                          <Text
                            style={{
                              color: C.amber,
                              fontSize: 11,
                              fontWeight: "500",
                            }}
                          >
                            {waiting} need you
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: C.line,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${progress}%`,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor:
                              progress === 100 ? C.green : C.primary,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          color: progress === 100 ? C.green : C.moss,
                          fontSize: 11,
                          fontWeight: "500",
                        }}
                      >
                        {board.task_count
                          ? `${progress}% complete`
                          : "No tasks yet"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 10,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: C.line,
              backgroundColor: C.canvas,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                minHeight: 50,
                paddingLeft: 14,
                paddingRight: 4,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.line,
                backgroundColor: C.paper,
              }}
            >
              <Ionicons name="search-outline" size={20} color={C.moss} />
              <TextInput
                accessibilityLabel="Find a board"
                placeholder="Search your boards…"
                placeholderTextColor={C.muted}
                selectionColor={C.primary}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                style={{
                  flex: 1,
                  minWidth: 0,
                  color: C.ink,
                  fontSize: 15,
                  paddingVertical: 14,
                }}
              />
              {search ? (
                <TaskIconButton
                  icon="close-circle"
                  label="Clear board search"
                  onPress={() => setSearch("")}
                />
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
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
