import { DateField } from "./date-field";
import { shareTasksCsv } from "./export";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { C } from "@/components/ui";
import { BoardViews, type BoardView } from "./board-views";
import {
  attentionItems,
  duplicatePayload,
  hasActiveAgents,
  numericId,
  topLevel,
} from "./model";
import { matches, type AssigneeFilter, type StatusFilter } from "./filter";
import { moveTask } from "./board-order";
import { runBulk, bulkMessage, MAX_BULK } from "./bulk";
import {
  useTaskAction,
  useTaskQuery,
  useTaskWorkspace,
  taskKey,
} from "./provider";
import { AttentionList } from "./home-screen";
import {
  Action,
  Busy,
  Chip,
  ChoiceSheet,
  Empty,
  Failure,
  Page,
  PickField,
  Sheet,
  TaskIconButton,
  TaskInput,
  confirmAction,
  s,
  showError,
} from "./ui";
import type { TaskBoardDetail, TaskSummary } from "./types";

export function TaskBoardScreen() {
  const { boardId: raw } = useLocalSearchParams<{ boardId?: string }>();
  const id = numericId(raw);
  const router = useRouter();
  const context = useTaskWorkspace();
  const client = useQueryClient();
  const action = useTaskAction();
  const board = useTaskQuery(
    ["board", id],
    (client) => client.boards.get(id!),
    (data) => !!data?.tasks.some(hasActiveAgents),
    id !== null,
  );
  const [archived, setArchived] = useState(false);
  const archive = useTaskQuery(
    ["archived", id],
    (client) => client.tasks.list({ board_id: id!, include_archived: true }),
    false,
    id !== null && archived,
  );
  const members = useTaskQuery(["members"], (client) => client.members());
  const skills = useTaskQuery(["skills"], (client) => client.skills());
  const [bulkDue, setBulkDue] = useState<string | null>(null);
  const [bulkLabels, setBulkLabels] = useState("");
  const attention = useTaskQuery(
    ["attention"],
    (client) => client.tasks.attention(),
    true,
    board.isSuccess,
  );
  const [view, setView] = useState<BoardView>("list");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [assignee, setAssignee] = useState<AssigneeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [move, setMove] = useState<TaskSummary | null>(null);
  const [selected, setSelected] = useState<Set<number> | null>(null);
  const [bulk, setBulk] = useState<
    | "status"
    | "priority"
    | "group"
    | "people"
    | "agents"
    | "due"
    | "labels"
    | null
  >(null);
  const source = useMemo(
    () =>
      archived
        ? (archive.data ?? []).filter((task) => task.is_archived)
        : (board.data?.tasks ?? []),
    [archived, archive.data, board.data?.tasks],
  );
  const tasks = useMemo(
    () =>
      topLevel(source).filter((task) =>
        matches(task, search.trim().toLowerCase(), priority, assignee, status),
      ),
    [source, search, priority, assignee, status],
  );
  const waiting = useMemo(
    () =>
      new Set(
        attentionItems(attention.data, id ?? undefined).map(
          (row) => row.taskId,
        ),
      ),
    [attention.data, id],
  );
  const [onlyAttention, setOnlyAttention] = useState(false);
  const visible = onlyAttention
    ? tasks.filter((task) => waiting.has(task.id))
    : tasks;
  if (!id)
    return (
      <Page title="Board">
        <Empty title="Invalid board link" />
      </Page>
    );
  if (context.loading || board.isPending)
    return (
      <Page title="Board">
        <Busy />
      </Page>
    );
  if (board.isError || !board.data)
    return (
      <Page title="Board">
        <Failure
          error={board.error}
          retry={() => {
            void board.refetch();
          }}
        />
      </Page>
    );
  const data = board.data;
  const filtersActive =
    !!search.trim() ||
    priority !== "all" ||
    assignee !== "all" ||
    status !== "all" ||
    onlyAttention;
  const picked = source.filter((task) => selected?.has(task.id));
  function onCreate(due?: string, group?: number) {
    router.push({
      pathname: "/(tabs)/tasks/edit",
      params: {
        boardId: id!,
        ...(due ? { due } : {}),
        ...(group ? { groupId: group } : {}),
      },
    } as Href);
  }
  async function reorder(task: TaskSummary, position: number) {
    if (action.busy || filtersActive || archived || data.is_archived) return;
    const key = taskKey(context.workspace!.id, "board", id);
    await client.cancelQueries({ queryKey: key });
    const previous = client.getQueryData<TaskBoardDetail>(key);
    const roots = new Map(
      moveTask(topLevel(data.tasks), task.id, task.column_id, position).map(
        (task) => [task.id, task],
      ),
    );
    client.setQueryData<TaskBoardDetail>(key, {
      ...data,
      tasks: data.tasks.map((task) => roots.get(task.id) ?? task),
    });
    try {
      await action.run((client) =>
        client.tasks.move(task.id, { column_id: task.column_id, position }),
      );
    } catch (error) {
      if (previous) client.setQueryData(key, previous);
      showError(error);
    }
  }
  async function bulkAction(
    kind:
      | "archive"
      | "restore"
      | "duplicate"
      | "delete"
      | "status"
      | "priority"
      | "group"
      | "people"
      | "agents"
      | "due"
      | "labels",
    value?: string | string[] | null,
  ) {
    if (!picked.length || picked.length > MAX_BULK) {
      Alert.alert("Choose tasks", `Select between 1 and ${MAX_BULK} tasks.`);
      return false;
    }
    const byId = new Map(picked.map((task) => [task.id, task]));
    if (
      kind === "labels" &&
      Array.isArray(value) &&
      (value.length > 20 || value.some((label) => label.length > 40))
    ) {
      showError(
        new Error("Use at most 20 labels, with up to 40 characters each."),
      );
      return false;
    }
    if (kind === "agents" && Array.isArray(value) && value.length > 10) {
      showError(new Error("Choose at most 10 agents."));
      return false;
    }
    if (kind === "people" && Array.isArray(value) && value.length > 20) {
      showError(new Error("Choose at most 20 people."));
      return false;
    }
    try {
      const result = await action.run((client) =>
        runBulk(
          picked.map((task) => task.id),
          (taskId) => {
            if (kind === "archive") return client.tasks.archive(taskId);
            if (kind === "restore") return client.tasks.restore(taskId);
            if (kind === "delete") return client.tasks.remove(taskId);
            if (kind === "duplicate")
              return client.tasks.create(duplicatePayload(byId.get(taskId)!));
            if (kind === "status")
              return client.tasks.move(taskId, { column_id: Number(value) });
            if (kind === "people")
              return client.tasks.update(taskId, {
                assignee_user_ids: Array.isArray(value)
                  ? value.map(Number)
                  : [],
              });
            if (kind === "agents")
              return client.tasks.update(taskId, {
                skill_ids: Array.isArray(value) ? value.map(Number) : [],
              });
            if (kind === "due")
              return client.tasks.update(
                taskId,
                typeof value === "string" && value
                  ? { due_at: value }
                  : { clear_due_at: true },
              );
            if (kind === "labels")
              return client.tasks.update(taskId, {
                labels: Array.isArray(value) ? value : [],
              });
            return client.tasks.update(
              taskId,
              kind === "priority"
                ? { priority: String(value) }
                : { group_id: Number(value) },
            );
          },
        ),
      );
      setSelected(result.failed.length ? new Set(result.failed) : null);
      Alert.alert(
        result.failed.length ? "Some tasks could not change" : "Tasks updated",
        bulkMessage(
          {
            archive: "Archived",
            restore: "Restored",
            duplicate: "Duplicated",
            delete: "Deleted",
            status: "Moved",
            priority: "Updated",
            group: "Moved",
            people: "Assigned",
            agents: "Assigned",
            due: "Updated",
            labels: "Updated",
          }[kind],
          result,
        ),
      );
      return result.failed.length === 0;
    } catch (error) {
      showError(error);
      return false;
    }
  }
  return (
    <Page
      title={data.name}
      subtitle={`${data.open_task_count} open · ${data.task_count} tasks${data.is_archived ? " · Archived board" : ""}`}
      actions={
        <>
          <TaskIconButton
            icon="sparkles-outline"
            label="Board AI assistant"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/tasks/plan",
                params: { boardId: id },
              } as Href)
            }
          />
          <TaskIconButton
            icon="options-outline"
            label="Board settings"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/tasks/board-settings",
                params: { boardId: id },
              } as Href)
            }
          />
          {!data.is_archived ? (
            <TaskIconButton
              icon="add"
              label="Create task"
              onPress={() => onCreate()}
            />
          ) : null}
        </>
      }
    >
      <View style={{ paddingHorizontal: 22, paddingTop: 14, gap: 12 }}>
        <AttentionList boardId={id} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TaskInput
              label="Find a task"
              value={search}
              onChangeText={(value) => {
                setSelected(null);
                setSearch(value);
              }}
              placeholder="Search titles, labels, people…"
            />
          </View>
          <TaskIconButton
            icon={filtersActive ? "filter" : "filter-outline"}
            label="Filter tasks"
            onPress={() => setFiltersOpen(true)}
          />
          <TaskIconButton
            icon={selected ? "close" : "checkbox-outline"}
            label={selected ? "Cancel selection" : "Select tasks"}
            onPress={() => setSelected((old) => (old ? null : new Set()))}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7, paddingBottom: 10 }}
        >
          {(
            [
              "list",
              "board",
              "calendar",
              "timeline",
              "dashboard",
            ] as BoardView[]
          ).map((item) => (
            <Chip
              key={item}
              label={item[0].toUpperCase() + item.slice(1)}
              selected={view === item}
              onPress={() => setView(item)}
            />
          ))}
        </ScrollView>
        {archived ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: C.amber }}>Archived tasks</Text>
            <Chip
              label="Show active"
              onPress={() => {
                setSelected(null);
                setArchived(false);
              }}
            />
          </View>
        ) : null}
        {selected ? (
          <View style={[s.card, { padding: 12, backgroundColor: C.lavender }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: C.primary, fontWeight: "600" }}>
                {picked.length} selected
              </Text>
              <Chip
                label="Select visible"
                onPress={() => {
                  if (visible.length > MAX_BULK)
                    Alert.alert(
                      "Too many tasks",
                      `Select at most ${MAX_BULK} tasks at a time.`,
                    );
                  else setSelected(new Set(visible.map((task) => task.id)));
                }}
              />
            </View>
            <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
              {!archived && !data.is_archived ? (
                <>
                  <Chip label="Status" onPress={() => setBulk("status")} />
                  <Chip label="Priority" onPress={() => setBulk("priority")} />
                  <Chip label="Group" onPress={() => setBulk("group")} />
                  <Chip label="People" onPress={() => setBulk("people")} />
                  <Chip label="Agents" onPress={() => setBulk("agents")} />
                  <Chip
                    label="Due date"
                    onPress={() => {
                      setBulkDue(null);
                      setBulk("due");
                    }}
                  />
                  <Chip
                    label="Labels"
                    onPress={() => {
                      setBulkLabels("");
                      setBulk("labels");
                    }}
                  />
                  <Chip
                    label="Duplicate"
                    onPress={() => {
                      void bulkAction("duplicate");
                    }}
                  />
                </>
              ) : null}
              {!data.is_archived ? (
                <Chip
                  label={archived ? "Restore" : "Archive"}
                  onPress={() =>
                    confirmAction(
                      archived
                        ? "Restore selected tasks?"
                        : "Archive selected tasks?",
                      `${picked.length} tasks will be changed.`,
                      () => {
                        void bulkAction(archived ? "restore" : "archive");
                      },
                      !archived,
                    )
                  }
                />
              ) : null}
              <Chip
                label="Export CSV"
                onPress={() => {
                  if (picked.length)
                    void shareTasksCsv(data, picked).catch(showError);
                  else Alert.alert("Select tasks first");
                }}
              />
              <Chip
                label="Delete"
                color={C.red}
                onPress={() =>
                  confirmAction(
                    "Permanently delete selected tasks?",
                    "This also removes subtasks, comments, and history. Only tasks you are allowed to delete will be removed.",
                    () => {
                      void bulkAction("delete");
                    },
                  )
                }
              />
            </ScrollView>
          </View>
        ) : null}
        {action.busy ? (
          <Text accessibilityLiveRegion="polite" style={s.hint}>
            Saving your changes…
          </Text>
        ) : null}
      </View>
      {archived && archive.isPending ? (
        <Busy />
      ) : archived && archive.isError ? (
        <Failure
          error={archive.error}
          retry={() => {
            void archive.refetch();
          }}
        />
      ) : (
        <BoardViews
          view={view}
          board={data}
          tasks={visible}
          selected={selected}
          onSelect={(taskId) =>
            setSelected((old) => {
              const next = new Set(old);
              if (next.has(taskId)) next.delete(taskId);
              else if (next.size < MAX_BULK) next.add(taskId);
              return next;
            })
          }
          onOpen={(taskId) =>
            router.push(`/(tabs)/tasks/task/${taskId}` as Href)
          }
          onStatus={(task) => {
            if (!archived && !data.is_archived && !action.busy) setMove(task);
          }}
          refresh={() => {
            void board.refetch();
            if (archived) void archive.refetch();
          }}
          refreshing={board.isRefetching || (archived && archive.isRefetching)}
          canDrag={
            !filtersActive &&
            !archived &&
            !data.is_archived &&
            !selected &&
            !action.busy
          }
          onReorder={(task, position) => {
            void reorder(task, position);
          }}
          onCreate={onCreate}
        />
      )}
      {filtersOpen ? (
        <Sheet title="Find your focus" onClose={() => setFiltersOpen(false)}>
          <PickField
            label="Status"
            choices={[
              { value: "all", label: "All statuses" },
              ...data.columns.map((column) => ({
                value: String(column.id),
                label: column.name,
              })),
            ]}
            values={[String(status)]}
            onChange={(values) => {
              setSelected(null);
              setStatus(values[0] === "all" ? "all" : Number(values[0]));
            }}
          />
          <PickField
            label="Priority"
            choices={[
              { value: "all", label: "All priorities" },
              ...data.priority_labels.map((priority) => ({
                value: priority.key,
                label: priority.name,
                color: priority.color,
              })),
            ]}
            values={[priority]}
            onChange={(values) => {
              setSelected(null);
              setPriority(values[0]);
            }}
          />
          <PickField
            label="Assigned to"
            choices={[
              { value: "all", label: "Everyone" },
              { value: "unassigned", label: "Unassigned people and agents" },
              ...(members.data?.members ?? []).map((person) => ({
                value: String(person.user_id),
                label: person.full_name || person.email,
              })),
            ]}
            values={[String(assignee)]}
            onChange={(values) => {
              setSelected(null);
              setAssignee(
                ["all", "unassigned"].includes(values[0])
                  ? (values[0] as AssigneeFilter)
                  : Number(values[0]),
              );
            }}
          />
          <Chip
            label="Needs my attention"
            selected={onlyAttention}
            onPress={() => {
              setOnlyAttention((old) => !old);
              setSelected(null);
            }}
          />
          <Chip
            label="Show archived tasks"
            selected={archived}
            onPress={() => {
              setSelected(null);
              setArchived((old) => !old);
            }}
          />
          <Action
            title="Clear filters"
            secondary
            onPress={() => {
              setSelected(null);
              setSearch("");
              setPriority("all");
              setAssignee("all");
              setStatus("all");
              setOnlyAttention(false);
              setArchived(false);
            }}
          />
          <Action title="Done" onPress={() => setFiltersOpen(false)} />
        </Sheet>
      ) : null}
      {move ? (
        <ChoiceSheet
          title={`Move ${move.title}`}
          choices={data.columns.map((column) => ({
            value: String(column.id),
            label: column.name,
            color: column.color ?? undefined,
          }))}
          initial={[String(move.column_id)]}
          onClose={() => setMove(null)}
          onDone={(values) => {
            const taskId = move.id;
            setMove(null);
            void action
              .run((client) =>
                client.tasks.move(taskId, { column_id: Number(values[0]) }),
              )
              .catch(showError);
          }}
        />
      ) : null}
      {bulk && bulk !== "due" && bulk !== "labels" ? (
        <ChoiceSheet
          title={`Change ${bulk}`}
          choices={
            bulk === "status"
              ? data.columns.map((column) => ({
                  value: String(column.id),
                  label: column.name,
                }))
              : bulk === "priority"
                ? data.priority_labels.map((priority) => ({
                    value: priority.key,
                    label: priority.name,
                  }))
                : bulk === "people"
                  ? (members.data?.members ?? [])
                      .filter((person) => person.status === "active")
                      .map((person) => ({
                        value: String(person.user_id),
                        label: person.full_name || person.email,
                      }))
                  : bulk === "agents"
                    ? (skills.data ?? [])
                        .filter((skill) => skill.is_active)
                        .map((skill) => ({
                          value: String(skill.id),
                          label: skill.name,
                        }))
                    : data.groups.map((group) => ({
                        value: String(group.id),
                        label: group.name,
                      }))
          }
          multiple={bulk === "people" || bulk === "agents"}
          onClose={() => setBulk(null)}
          onDone={(values) => {
            const kind = bulk;
            setBulk(null);
            if (kind === "people" || kind === "agents")
              confirmAction(
                "Replace assignments?",
                "The selected people or agents will replace the current assignments on every selected task. Assigned agents may start work.",
                () => {
                  void bulkAction(kind, values);
                },
                false,
              );
            else void bulkAction(kind, values[0]);
          }}
        />
      ) : null}
      {bulk === "due" ? (
        <Sheet
          title="Change due dates"
          busy={action.busy}
          onClose={() => setBulk(null)}
        >
          <DateField
            label="New due date"
            value={bulkDue}
            onChange={setBulkDue}
          />
          <Action
            title="Apply due date"
            busy={action.busy}
            disabled={!bulkDue}
            onPress={() => {
              void bulkAction("due", bulkDue).then((saved) => {
                if (saved) setBulk(null);
              });
            }}
          />
          <Action
            title="Clear due dates"
            secondary
            busy={action.busy}
            onPress={() => {
              void bulkAction("due", null).then((saved) => {
                if (saved) setBulk(null);
              });
            }}
          />
        </Sheet>
      ) : null}
      {bulk === "labels" ? (
        <Sheet
          title="Replace labels"
          busy={action.busy}
          onClose={() => setBulk(null)}
        >
          <TaskInput
            label="Labels, separated by commas"
            value={bulkLabels}
            onChangeText={setBulkLabels}
            maxLength={840}
          />
          <Text style={s.hint}>
            Replaces all labels on the selected tasks. Leave blank to clear
            them.
          </Text>
          <Action
            title="Replace labels"
            busy={action.busy}
            onPress={() => {
              const labels = [
                ...new Set(
                  bulkLabels
                    .split(",")
                    .map((label) => label.trim())
                    .filter(Boolean),
                ),
              ];
              void bulkAction("labels", labels).then((saved) => {
                if (saved) setBulk(null);
              });
            }}
          />
        </Sheet>
      ) : null}
    </Page>
  );
}
