import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Text,
  View,
} from "react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { randomUUID } from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { C } from "@/components/ui";
import { ChatMessage } from "@/components/chat-message";
import { ChatSession } from "@/lib/chat-session";
import { streamChat } from "@/lib/api";
import { buildPlanBoardPrompt } from "./plan-prompt";
import { numericId, plannedBoardId } from "./model";
import { taskKey, useTaskQuery, useTaskWorkspace } from "./provider";
import { Action, Chip, Page, TaskInput, s, showError } from "./ui";

type PlanMessage = { id: string; role: "user" | "assistant"; content: string };
export function PlannerScreen() {
  const params = useLocalSearchParams<{ boardId?: string }>();
  const routeBoard = numericId(params.boardId);
  const router = useRouter();
  const context = useTaskWorkspace();
  const client = useQueryClient();
  const board = useTaskQuery(
    ["board", routeBoard],
    (client) => client.boards.get(routeBoard!),
    false,
    routeBoard !== null,
  );
  const [session] = useState(
    () => new ChatSession(() => `plan-${randomUUID()}`),
  );
  const [messages, setMessages] = useState<PlanMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [createdBoard, setCreatedBoard] = useState<number | null>(routeBoard);
  const controller = useRef<AbortController | null>(null);
  const version = useRef(0);
  const sending = useRef(false);
  const stop = useCallback(() => {
    version.current++;
    controller.current?.abort();
    controller.current = null;
    sending.current = false;
    setBusy(false);
    setStatus("Response stopped. Board changes already saved are kept.");
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        stop();
      },
      [stop],
    ),
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "background") stop();
    });
    return () => listener.remove();
  }, [stop]);
  async function send() {
    const prompt = text.trim();
    const workspaceId = context.workspace?.id;
    if (
      !prompt ||
      !workspaceId ||
      context.loading ||
      sending.current ||
      (routeBoard && !board.data) ||
      board.data?.is_archived
    )
      return;
    const run = ++version.current;
    const abort = new AbortController();
    controller.current = abort;
    sending.current = true;
    const userId = randomUUID();
    const replyId = randomUUID();
    let accumulated = "";
    let full = prompt;
    const currentBoard = routeBoard ?? createdBoard;
    if (currentBoard) {
      full = `[Context: The user is viewing task board ${board.data?.name ?? `#${currentBoard}`} (board_id: ${currentBoard}). Apply changes to this board unless another board is explicitly requested.${board.data ? ` Existing groups: ${board.data.groups.map((group) => group.name).join(", ")}. Existing statuses: ${board.data.columns.map((column) => column.name).join(", ")}.` : ""}]\n\n${prompt}`;
    } else if (!messages.length) full = buildPlanBoardPrompt(prompt);
    setText("");
    setBusy(true);
    setStatus(currentBoard ? "Updating your board…" : "Planning your project…");
    setMessages((old) => [
      ...old,
      { id: userId, role: "user", content: prompt },
      { id: replyId, role: "assistant", content: "" },
    ]);
    try {
      await streamChat(
        session.request(full, "chat"),
        (event) => {
          if (run !== version.current || abort.signal.aborted) return;
          session.accept(event);
          if (event.type === "token" && typeof event.content === "string") {
            accumulated += event.content;
            setMessages((old) =>
              old.map((message) =>
                message.id === replyId
                  ? { ...message, content: accumulated }
                  : message,
              ),
            );
            const id = plannedBoardId(accumulated);
            if (id) setCreatedBoard(id);
          }
          if (event.type === "tool_call") {
            const tool = String(event.name ?? "");
            setStatus(
              (
                {
                  search_knowledge_base: "Looking through workspace knowledge…",
                  search_web: "Researching the next steps…",
                  create_task_board: "Building phases and tasks…",
                } as Record<string, string>
              )[tool] ?? "Applying your board changes…",
            );
          }
          if (event.type === "tool_result") {
            void client.invalidateQueries({ queryKey: taskKey(workspaceId) });
            if (event.name === "create_task_board") {
              const id = plannedBoardId(event.content);
              if (id) setCreatedBoard(id);
            }
          }
          if (event.type === "done")
            setStatus("Your board is ready to review.");
          if (event.type === "error") {
            const message = String(
              event.message ?? "Planning could not finish. Please try again.",
            );
            setMessages((old) =>
              old.map((row) =>
                row.id === replyId
                  ? {
                      ...row,
                      content: row.content
                        ? `${row.content}\n\n${message}`
                        : message,
                    }
                  : row,
              ),
            );
            setStatus("Planning needs another try.");
          }
        },
        abort.signal,
        workspaceId,
      );
    } catch (error) {
      if (run !== version.current || abort.signal.aborted) return;
      setMessages((old) =>
        old.map((row) =>
          row.id === replyId
            ? {
                ...row,
                content:
                  error instanceof Error
                    ? error.message
                    : "Could not finish planning.",
              }
            : row,
        ),
      );
      setStatus("Planning needs another try.");
    } finally {
      void client.invalidateQueries({ queryKey: taskKey(workspaceId) });
      if (run === version.current) {
        sending.current = false;
        setBusy(false);
        controller.current = null;
      }
    }
  }
  return (
    <Page
      title={routeBoard ? "Board assistant" : "Plan with Hoopi"}
      subtitle={board.data?.name ?? context.workspace?.name}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        automaticOffset
      >
        <FlatList
          inverted={messages.length > 0}
          data={[...messages].reverse()}
          keyExtractor={(message) => message.id}
          contentContainerStyle={{ padding: 22, gap: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <ChatMessage
              role={item.role}
              content={item.content}
              busy={busy && item.id === messages.at(-1)?.id}
            />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
              <Text style={[s.title, { fontSize: 30 }]}>
                {routeBoard
                  ? "A little help moving things forward."
                  : "An idea, with a way forward."}
              </Text>
              <Text style={s.hint}>
                {routeBoard
                  ? "Ask Hoopi to add phases, create tasks, or update priorities on this board."
                  : "Describe a project. Hoopi researches your workspace knowledge first, then builds a board with phases and tasks."}
              </Text>
              {(routeBoard
                ? ["Add a QA & testing phase", "Add review checklists"]
                : ["Plan a product launch", "Organize our onboarding process"]
              ).map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  onPress={() => setText(prompt)}
                />
              ))}
            </View>
          }
        />
        <View
          style={{
            padding: 18,
            gap: 10,
            borderTopWidth: 1,
            borderTopColor: C.line,
            backgroundColor: C.canvas,
          }}
        >
          {status ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {busy ? (
                <ActivityIndicator color={C.primary} size="small" />
              ) : null}
              <Text
                accessibilityLiveRegion="polite"
                style={[s.hint, { flex: 1 }]}
              >
                {status}
              </Text>
            </View>
          ) : null}
          {createdBoard && !busy ? (
            <Action
              title="Open board"
              secondary
              onPress={() =>
                router.push(`/(tabs)/tasks/board/${createdBoard}` as Href)
              }
            />
          ) : null}
          {routeBoard && board.isError ? (
            <Text style={{ color: C.red }}>
              Could not load this board. Return to Tasks and try again.
            </Text>
          ) : null}
          {board.data?.is_archived ? (
            <Text style={{ color: C.amber }}>
              Restore the board before asking Hoopi to change it.
            </Text>
          ) : null}
          <TaskInput
            label={
              routeBoard || messages.length
                ? "Your message"
                : "Describe your project"
            }
            multiline
            value={text}
            onChangeText={setText}
            maxLength={!routeBoard && !messages.length ? 2000 : 5000}
            style={{ minHeight: 48, maxHeight: 120 }}
          />
          <Action
            title={
              busy
                ? "Stop response"
                : messages.length
                  ? "Send message"
                  : routeBoard
                    ? "Update board"
                    : "Build a plan"
            }
            busy={false}
            disabled={
              !busy &&
              (!text.trim() ||
                context.loading ||
                !context.workspace ||
                (!!routeBoard && !board.data) ||
                !!board.data?.is_archived)
            }
            onPress={
              busy
                ? stop
                : () => {
                    void send().catch(showError);
                  }
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}
