import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Markdown from "react-native-markdown-display";
import { C } from "@/components/ui";
import { useAuth } from "@/context/auth";
import {
  hasActiveAgents,
  numericId,
  dateLabel,
  duplicatePayload,
  plannedBoardId,
} from "./model";
import { useTaskAction, useTaskQuery, useTaskWorkspace } from "./provider";
import {
  Action,
  Busy,
  Chip,
  ChoiceSheet,
  Empty,
  Failure,
  Page,
  Section,
  Sheet,
  TaskIconButton,
  TaskInput,
  confirmAction,
  s,
  showError,
} from "./ui";
import type { PendingQuestionRecord } from "./types";

export function TaskMarkdown({ content }: { content: string }) {
  const router = useRouter();
  return (
    <Markdown
      style={{
        body: { color: C.ink, fontSize: 14, lineHeight: 23 },
        link: { color: C.primary },
        code_inline: { backgroundColor: C.lavender },
        fence: { backgroundColor: C.paper, color: C.ink, borderColor: C.line },
        table: { borderColor: C.line },
      }}
      onLinkPress={(url) => {
        const boardId =
          /(?:^|\/)dashboard\/tasks\/\d+/.test(url) || /^\/tasks\/\d+/.test(url)
            ? plannedBoardId(url)
            : null;
        if (boardId) router.push(`/(tabs)/tasks/board/${boardId}` as Href);
        else if (/^(https?:|mailto:)/i.test(url))
          void Linking.openURL(url).catch(showError);
        return false;
      }}
    >
      {content}
    </Markdown>
  );
}

export function TaskDetailScreen() {
  const { taskId: raw } = useLocalSearchParams<{ taskId?: string }>();
  const id = numericId(raw);
  const router = useRouter();
  const { user } = useAuth();
  const { workspace, loading } = useTaskWorkspace();
  const task = useTaskQuery(
    ["task", id],
    (client) => client.tasks.get(id!),
    hasActiveAgents,
    id !== null,
  );
  const boardId = task.data?.board_id;
  const board = useTaskQuery(
    ["board", boardId],
    (client) => client.boards.get(boardId!),
    false,
    !!boardId,
  );
  const history = useTaskQuery(
    ["runs", id],
    (client) => client.tasks.skillRuns(id!),
    () => hasActiveAgents(task.data),
    id !== null && task.isSuccess,
  );
  const attention = useTaskQuery(
    ["attention"],
    (client) => client.tasks.attention(),
    true,
    task.isSuccess,
  );
  const members = useTaskQuery(["members"], (client) => client.members());
  const skills = useTaskQuery(["skills"], (client) => client.skills());
  const action = useTaskAction();
  const [comment, setComment] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  if (!id)
    return (
      <Page title="Task">
        <Empty title="Invalid task link" />
      </Page>
    );
  if (loading || task.isPending)
    return (
      <Page title="Task">
        <Busy />
      </Page>
    );
  if (task.isError || !task.data)
    return (
      <Page title="Task">
        <Failure
          error={task.error}
          retry={() => {
            void task.refetch();
          }}
        />
      </Page>
    );
  const data = task.data;
  const blocked = !!data.is_archived || !!board.data?.is_archived;
  const canDelete =
    user?.is_superuser ||
    ["owner", "admin"].includes(workspace?.role ?? "") ||
    data.created_by_user_id === user?.id;
  const reviews = attention.data?.reviews.find(
    (review) => review.task_id === id,
  );
  const reviewIds =
    reviews?.run_ids ??
    (data.skills?.length &&
    data.skills.every((skill) => skill.last_run?.status === "completed")
      ? data.skills.map((skill) => skill.last_run!.id)
      : []);
  const questions =
    attention.data?.questions.filter((question) => question.task_id === id) ??
    [];
  const approvals =
    attention.data?.approvals.filter((approval) => approval.task_id === id) ??
    [];
  const latestRuns = new Set(data.skills?.map((skill) => skill.last_run?.id));
  function act(operation: Parameters<typeof action.run>[0]) {
    void action.run(operation).catch(showError);
  }
  async function remove() {
    try {
      await action.run((client) => client.tasks.remove(id!));
      router.back();
    } catch (error) {
      showError(error);
    }
  }
  return (
    <Page
      title={data.title}
      subtitle={`${data.board_name} · ${data.column_name}`}
      actions={
        !blocked ? (
          <TaskIconButton
            icon="create-outline"
            label="Edit task"
            disabled={action.busy}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/tasks/edit",
                params: { boardId: data.board_id, taskId: id },
              } as Href)
            }
          />
        ) : undefined
      }
    >
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl
            refreshing={task.isRefetching}
            onRefresh={() => {
              void task.refetch();
              void history.refetch();
              void attention.refetch();
            }}
            tintColor={C.primary}
          />
        }
      >
        {data.parent_task_id ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push(`/(tabs)/tasks/task/${data.parent_task_id}` as Href)
            }
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: C.primary }}>
              ↖ {data.parent_title ?? "Parent task"}
            </Text>
          </Pressable>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Chip
            label={data.column_name}
            onPress={blocked ? undefined : () => setStatusOpen(true)}
          />
          <Chip
            label={
              board.data?.priority_labels.find(
                (priority) => priority.key === data.priority,
              )?.name ?? data.priority
            }
          />
          <Chip label={dateLabel(data.due_at)} />
          {data.is_archived ? <Chip label="Archived" color={C.amber} /> : null}
        </View>
        {board.isError ? (
          <Failure
            error={board.error}
            retry={() => {
              void board.refetch();
            }}
          />
        ) : null}
        {board.data?.is_archived ? (
          <Text style={{ color: C.amber }}>
            This board is archived. Restore it from board settings to make
            changes.
          </Text>
        ) : null}
        {data.description ? (
          <TaskMarkdown content={data.description} />
        ) : (
          <Text style={s.hint}>
            A little context goes a long way. Add a description in Edit.
          </Text>
        )}
        <Section title="People & agents">
          <Text style={{ color: C.ink }}>
            {data.assignees
              .map((person) => person.name ?? "Member")
              .join(", ") || "No people assigned"}
          </Text>
          {data.skills?.map((skill) => (
            <View key={skill.skill_id} style={s.card}>
              <Text style={{ color: C.primary, fontWeight: "600" }}>
                ✦ {skill.name}
              </Text>
              <Text style={s.hint}>
                {skill.last_run?.status?.replaceAll("_", " ") ?? "Assigned"}
              </Text>
            </View>
          ))}
        </Section>
        {data.labels.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {data.labels.map((label) => (
              <Chip key={label} label={label} />
            ))}
          </View>
        ) : null}
        {board.data?.fields.length ? (
          <Section title="Board fields">
            {board.data.fields.map((field) => {
              const value = data.custom_values[String(field.id)];
              const formatted =
                field.type === "label"
                  ? field.options.find((option) => option.id === value)?.name
                  : Array.isArray(value)
                    ? value
                        .map((person) =>
                          person.kind === "agent"
                            ? (data.skills?.find(
                                (skill) => skill.skill_id === person.id,
                              )?.name ??
                              skills.data?.find(
                                (skill) => skill.id === person.id,
                              )?.name ??
                              `Agent #${person.id}`)
                            : (data.assignees.find(
                                (assignee) => assignee.user_id === person.id,
                              )?.name ??
                              members.data?.members.find(
                                (member) => member.user_id === person.id,
                              )?.full_name ??
                              members.data?.members.find(
                                (member) => member.user_id === person.id,
                              )?.email ??
                              `Member #${person.id}`),
                        )
                        .join(", ")
                    : value;
              return (
                <View key={field.id} style={{ gap: 5 }}>
                  <Text style={s.label}>{field.name}</Text>
                  <Text style={{ color: C.ink }}>
                    {formatted == null || formatted === ""
                      ? "—"
                      : String(formatted)}
                  </Text>
                </View>
              );
            })}
          </Section>
        ) : null}
        <Section title="AI coverage">
          <Text style={{ color: C.ink }}>
            {data.ai_coverage_percent == null
              ? "Not evaluated yet"
              : `${data.ai_coverage_percent}% · ${data.ai_coverage_label ?? "Evaluated"}`}
          </Text>
          <Action
            title="Evaluate AI coverage"
            secondary
            disabled={blocked}
            busy={action.busy}
            onPress={() => act((client) => client.tasks.refreshAiCoverage(id))}
          />
        </Section>
        <Section
          title={`Subtasks · ${data.subtask_done_count}/${data.subtask_count}`}
        >
          {data.subtasks.map((child) => (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              onPress={() =>
                router.push(`/(tabs)/tasks/task/${child.id}` as Href)
              }
              style={s.pick}
            >
              <Text style={{ color: child.completed_at ? C.green : C.primary }}>
                {child.completed_at ? "✓" : "○"}
              </Text>
              <Text style={{ flex: 1, color: C.ink }}>{child.title}</Text>
              <Text style={s.hint}>→</Text>
            </Pressable>
          ))}
          {!data.parent_task_id && !blocked ? (
            <Action
              title="Add subtask"
              secondary
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/tasks/edit",
                  params: { boardId: data.board_id, parentId: id },
                } as Href)
              }
            />
          ) : null}
        </Section>
        <Section title="Agent requests & results">
          {attention.isError ? (
            <Failure
              error={attention.error}
              retry={() => {
                void attention.refetch();
              }}
            />
          ) : null}
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
          {approvals.map((approval) => (
            <View
              key={approval.id}
              style={[s.card, { backgroundColor: C.peach }]}
            >
              <Text style={{ color: C.ink, fontWeight: "600" }}>
                {approval.skill_name} requests permission
              </Text>
              <Text style={{ color: C.ink }}>
                {approval.tool_name.replaceAll("_", " ")} ·{" "}
                {approval.integration_slug}
              </Text>
              {approval.tool_args ? (
                <Text selectable style={s.hint}>
                  {approval.tool_args}
                </Text>
              ) : null}
              <Action
                title="Allow action"
                busy={action.busy}
                onPress={() =>
                  confirmAction(
                    "Allow this action?",
                    "The agent will continue with the action shown above.",
                    () =>
                      act((client) =>
                        client.runPermission(
                          approval.run_id,
                          approval.id,
                          true,
                        ),
                      ),
                    false,
                  )
                }
              />
              <Action
                title="Decline action"
                secondary
                busy={action.busy}
                onPress={() =>
                  act((client) =>
                    client.runPermission(approval.run_id, approval.id, false),
                  )
                }
              />
            </View>
          ))}
          {!blocked && !data.completed_at && reviewIds.length > 0 ? (
            <View style={[s.card, { backgroundColor: C.blueTint }]}>
              <Text style={{ color: C.ink }}>
                Review the agent results below before approving completion.
              </Text>
              <Action
                title="Approve reviewed results"
                busy={action.busy}
                onPress={() =>
                  confirmAction(
                    "Approve these results?",
                    "This completes the task after the server checks all required agent results.",
                    () =>
                      act((client) =>
                        client.tasks.approveReview(id, reviewIds),
                      ),
                    false,
                  )
                }
              />
            </View>
          ) : null}
          {history.isError ? (
            <Failure
              error={history.error}
              retry={() => {
                void history.refetch();
              }}
            />
          ) : null}
          {history.data?.map((run) => (
            <View key={run.id} style={s.card}>
              <Text style={{ color: C.ink, fontWeight: "600" }}>
                {run.skill_name}
              </Text>
              <Text style={s.hint}>{run.status.replaceAll("_", " ")}</Text>
              {run.error ? (
                <Text style={{ color: C.red }}>{run.error}</Text>
              ) : null}
              {run.result_summary ? (
                <Action
                  title="Read result"
                  secondary
                  onPress={() => setResult(run.result_summary)}
                />
              ) : null}
              {latestRuns.has(run.id) &&
              ["pending", "running", "awaiting_approval"].includes(
                run.status,
              ) ? (
                <Action
                  title="Cancel agent run"
                  secondary
                  busy={action.busy}
                  onPress={() =>
                    confirmAction(
                      "Cancel this run?",
                      "The agent will stop working on this run.",
                      () => act((client) => client.cancelRun(run.id)),
                    )
                  }
                />
              ) : null}
              {!blocked &&
              latestRuns.has(run.id) &&
              run.skill_id &&
              (["failed", "cancelled"].includes(run.status) ||
                (run.status === "pending" && run.error)) ? (
                <Action
                  title="Retry agent"
                  secondary
                  busy={action.busy}
                  onPress={() =>
                    act((client) => client.tasks.retrySkill(id, run.skill_id!))
                  }
                />
              ) : null}
            </View>
          ))}
          {history.data?.length === 0 ? (
            <Text style={s.hint}>
              Assign agents from Edit to start work. Their results stay here for
              review.
            </Text>
          ) : null}
        </Section>
        <Section title="Activity & comments">
          {data.activity.map((row) => (
            <View
              key={row.id}
              style={{
                borderLeftWidth: 1,
                borderLeftColor: C.line,
                paddingLeft: 14,
                gap: 5,
              }}
            >
              <Text style={s.label}>
                {row.monitor_name ??
                  row.actor_name ??
                  (row.agent_run_id ? "Agent" : "Workspace member")}{" "}
                · {new Date(row.created_at).toLocaleString()}
              </Text>
              {row.kind === "commented" ? (
                <TaskMarkdown content={row.body} />
              ) : (
                <Text style={s.hint}>
                  {activityText(row.kind, row.payload)}
                </Text>
              )}
            </View>
          ))}
          {!blocked ? (
            <>
              <TaskInput
                label="Add a comment"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={5000}
              />
              <Action
                title="Post comment"
                busy={action.busy}
                disabled={!comment.trim()}
                onPress={() => {
                  void action
                    .run((client) =>
                      client.tasks.addComment(id, comment.trim()),
                    )
                    .then(() => setComment(""))
                    .catch(showError);
                }}
              />
            </>
          ) : null}
        </Section>
        {!blocked ? (
          <Action
            title="Duplicate task"
            secondary
            busy={action.busy}
            onPress={() => {
              void action
                .run((client) => client.tasks.create(duplicatePayload(data)))
                .then((created) =>
                  router.push(`/(tabs)/tasks/task/${created.id}` as Href),
                )
                .catch(showError);
            }}
          />
        ) : null}
        <Action
          title={data.is_archived ? "Restore task" : "Archive task"}
          secondary
          disabled={!!board.data?.is_archived}
          busy={action.busy}
          onPress={() =>
            data.is_archived
              ? act((client) => client.tasks.restore(id))
              : confirmAction(
                  "Archive this task?",
                  "You can restore it later from Archived tasks on the board.",
                  () => act((client) => client.tasks.archive(id)),
                )
          }
        />
        {canDelete ? (
          <Action
            title="Delete permanently"
            secondary
            danger
            busy={action.busy}
            onPress={() =>
              confirmAction(
                "Permanently delete this task?",
                "Its subtasks, comments, and history will also be deleted. This cannot be undone.",
                () => {
                  void remove();
                },
              )
            }
          />
        ) : null}
      </KeyboardAwareScrollView>
      {statusOpen && board.data ? (
        <ChoiceSheet
          title="Move task"
          choices={board.data.columns.map((column) => ({
            value: String(column.id),
            label: column.name,
            color: column.color ?? undefined,
          }))}
          initial={[String(data.column_id)]}
          onClose={() => setStatusOpen(false)}
          onDone={(values) => {
            setStatusOpen(false);
            if (Number(values[0]) !== data.column_id)
              act((client) =>
                client.tasks.move(id, { column_id: Number(values[0]) }),
              );
          }}
        />
      ) : null}
      {result ? (
        <Sheet title="Agent result" onClose={() => setResult(null)}>
          <TaskMarkdown content={result} />
        </Sheet>
      ) : null}
    </Page>
  );
}

function QuestionCard({ question }: { question: PendingQuestionRecord }) {
  const action = useTaskAction();
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const approval = question.kind === "approval";
  const questions = question.payload.questions ?? [];
  const complete =
    questions.length > 0 &&
    questions.every(
      (row) => other[row.header]?.trim() || choices[row.header]?.length,
    );
  function answer(kind: "accept" | "decline" | "cancel") {
    const answers: Record<string, string | string[]> = {};
    for (const row of questions)
      answers[row.header] =
        other[row.header]?.trim() ||
        (row.allow_multiple
          ? (choices[row.header] ?? [])
          : (choices[row.header]?.[0] ?? ""));
    void action
      .run((client) =>
        client.answer(
          question.id,
          kind,
          kind === "accept" && !approval ? answers : undefined,
        ),
      )
      .then((response) => {
        if (kind !== "cancel" && response.continuation_queued === false)
          Alert.alert(
            "Answer saved",
            "Open the task and retry the agent to continue.",
          );
      })
      .catch(showError);
  }
  return (
    <View style={[s.card, { backgroundColor: C.peach }]}>
      <Text style={{ fontWeight: "600", color: C.ink }}>
        {question.skill_name ?? "Agent"} ·{" "}
        {approval ? "Permission needed" : "Input needed"}
      </Text>
      {approval ? (
        <>
          <Text style={{ color: C.ink }}>
            Allow{" "}
            {question.payload.tool_name?.replaceAll("_", " ") ?? "this action"}?
          </Text>
          {question.payload.args ? (
            <Text selectable style={s.hint}>
              {JSON.stringify(question.payload.args, null, 2)}
            </Text>
          ) : null}
        </>
      ) : (
        questions.map((row) => (
          <View key={row.header} style={{ gap: 10 }}>
            <Text style={{ color: C.ink, lineHeight: 23 }}>{row.question}</Text>
            {row.options?.length ? (
              <View style={{ gap: 8 }}>
                {row.options.map((option) => {
                  const selected = choices[row.header]?.includes(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole={
                        row.allow_multiple ? "checkbox" : "radio"
                      }
                      accessibilityState={{ checked: !!selected }}
                      disabled={action.busy}
                      onPress={() => {
                        setOther((old) => ({ ...old, [row.header]: "" }));
                        setChoices((old) => ({
                          ...old,
                          [row.header]: row.allow_multiple
                            ? selected
                              ? old[row.header].filter(
                                  (value) => value !== option.value,
                                )
                              : [...(old[row.header] ?? []), option.value]
                            : [option.value],
                        }));
                      }}
                      style={[
                        s.pick,
                        { backgroundColor: selected ? C.lavender : C.paper },
                      ]}
                    >
                      <Text style={{ flex: 1, color: C.ink }}>
                        {option.label ?? option.value}
                        {row.recommended === option.value
                          ? " (recommended)"
                          : ""}
                      </Text>
                      <Text style={{ color: C.primary }}>
                        {selected ? "✓" : "○"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <TaskInput
              label={`Your answer · ${row.header}`}
              multiline
              value={other[row.header] ?? ""}
              maxLength={5000}
              onChangeText={(text) =>
                setOther((old) => ({ ...old, [row.header]: text }))
              }
              placeholder="Or write your own answer…"
            />
          </View>
        ))
      )}
      <Action
        title={approval ? "Allow and continue" : "Answer and continue"}
        disabled={!approval && !complete}
        busy={action.busy}
        onPress={() =>
          approval
            ? confirmAction(
                "Allow this action?",
                "The agent will continue with the action shown above.",
                () => answer("accept"),
                false,
              )
            : answer("accept")
        }
      />
      <Action
        title={approval ? "Do not allow" : "Decline to answer"}
        secondary
        busy={action.busy}
        onPress={() => answer("decline")}
      />
      <Action
        title="Cancel run"
        secondary
        busy={action.busy}
        onPress={() =>
          confirmAction(
            "Cancel the agent run?",
            "This ends the run rather than answering its question.",
            () => answer("cancel"),
          )
        }
      />
      {question.expires_at ? (
        <Text style={s.hint}>
          Expires {new Date(question.expires_at).toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
}
function activityText(kind: string, payload: Record<string, unknown>) {
  if (kind === "moved")
    return `Moved from ${payload.from_column_name ?? "previous status"} to ${payload.to_column_name ?? "new status"}`;
  if (kind === "updated")
    return `Updated ${
      Object.keys(payload)
        .filter((key) => !key.startsWith("previous_"))
        .map((key) => key.replaceAll("_", " "))
        .join(", ") || "task details"
    }`;
  return (
    {
      created: "Created the task",
      assigned: "Updated people or agents",
      archived: "Archived the task",
      restored: "Restored the task",
    }[kind] ?? kind
  );
}
