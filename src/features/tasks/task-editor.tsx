import { useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { C } from "@/components/ui";
import { numericId, dayKey, dueOnDay } from "./model";
import { useTaskAction, useTaskQuery, useTaskWorkspace } from "./provider";
import type {
  PersonRef,
  TaskBoardDetail,
  TaskDetail,
  TaskFieldValue,
  TaskUpdatePayload,
  WorkspaceMember,
  SkillChoice,
} from "./types";
import {
  Action,
  Busy,
  Empty,
  Failure,
  Page,
  PickField,
  Section,
  TaskInput,
  s,
  showError,
  type Choice,
} from "./ui";
import { DateField } from "./date-field";

export function TaskEditScreen() {
  const params = useLocalSearchParams<{
    boardId?: string;
    taskId?: string;
    parentId?: string;
    due?: string;
    groupId?: string;
  }>();
  const taskId = numericId(params.taskId);
  const boardId = numericId(params.boardId);
  const { workspace, loading } = useTaskWorkspace();
  const board = useTaskQuery(
    ["board", boardId],
    (client) => client.boards.get(boardId!),
    false,
    boardId !== null,
  );
  const task = useTaskQuery(
    ["task", taskId],
    (client) => client.tasks.get(taskId!),
    false,
    taskId !== null,
  );
  const members = useTaskQuery(["members"], (client) => client.members());
  const skills = useTaskQuery(["skills"], (client) => client.skills());
  if (!boardId)
    return (
      <Page title="Task">
        <Empty title="This board link is invalid" />
      </Page>
    );
  if (loading || board.isPending || (taskId && task.isPending))
    return (
      <Page title="Task">
        <Busy />
      </Page>
    );
  if (board.isError || (taskId && task.isError))
    return (
      <Page title="Task">
        <Failure
          error={board.error ?? task.error}
          retry={() => {
            void board.refetch();
            if (taskId) void task.refetch();
          }}
        />
      </Page>
    );
  if (!board.data || (taskId && !task.data))
    return (
      <Page title="Task">
        <Empty title="Task unavailable" />
      </Page>
    );
  if (task.data && task.data.board_id !== boardId)
    return (
      <Page title="Task">
        <Empty title="This task belongs to another board" />
      </Page>
    );
  return (
    <TaskEditor
      key={`${workspace?.id}-${boardId}-${taskId}`}
      board={board.data}
      task={task.data}
      members={members.data?.members ?? []}
      skills={(skills.data ?? []).filter((skill) => skill.is_active)}
      choicesError={members.isError || skills.isError}
      parentId={numericId(params.parentId)}
      initialGroup={numericId(params.groupId)}
      initialDue={params.due}
    />
  );
}

function TaskEditor({
  board,
  task,
  members,
  skills,
  choicesError,
  parentId,
  initialDue,
  initialGroup,
}: {
  board: TaskBoardDetail;
  task?: TaskDetail;
  members: WorkspaceMember[];
  skills: SkillChoice[];
  choicesError: boolean;
  parentId: number | null;
  initialDue?: string;
  initialGroup: number | null;
}) {
  const router = useRouter();
  const action = useTaskAction();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(
    task?.priority ??
      (board.priority_labels.some((priority) => priority.key === "medium")
        ? "medium"
        : (board.priority_labels[0]?.key ?? "medium")),
  );
  const [column, setColumn] = useState(task?.column_id ?? board.columns[0]?.id);
  const [group, setGroup] = useState(
    task?.group_id ?? initialGroup ?? board.groups[0]?.id,
  );
  const [due, setDue] = useState<string | null>(() => {
    if (task?.due_at) return task.due_at;
    try {
      return initialDue ? dueOnDay(initialDue) : null;
    } catch {
      return null;
    }
  });
  const [labels, setLabels] = useState(task?.labels.join(", ") ?? "");
  const [people, setPeople] = useState<number[]>(
    task?.assignees.map((person) => person.user_id) ?? [],
  );
  const [agents, setAgents] = useState<number[]>(
    task?.skills?.map((skill) => skill.skill_id) ?? [],
  );
  const [values, setValues] = useState<Record<string, TaskFieldValue | null>>(
    task?.custom_values ?? {},
  );
  const [numbers, setNumbers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      board.fields
        .filter((field) => field.type === "number")
        .map((field) => [
          String(field.id),
          task?.custom_values[String(field.id)] == null
            ? ""
            : String(task.custom_values[String(field.id)]),
        ]),
    ),
  );
  const currentPeople = task?.assignees ?? [];
  const memberChoices = members
    .filter((member) => member.status === "active")
    .map((member) => ({
      value: String(member.user_id),
      label: member.full_name || member.email,
    }));
  for (const person of currentPeople)
    if (
      !memberChoices.some((choice) => choice.value === String(person.user_id))
    )
      memberChoices.push({
        value: String(person.user_id),
        label: `${person.name ?? "Former member"} (previously assigned)`,
      });
  const skillChoices = skills.map((skill) => ({
    value: String(skill.id),
    label: skill.persona_name
      ? `${skill.name} · ${skill.persona_name}`
      : skill.name,
  }));
  for (const skill of task?.skills ?? [])
    if (!skillChoices.some((choice) => choice.value === String(skill.skill_id)))
      skillChoices.push({ value: String(skill.skill_id), label: skill.name });
  const changed = (a: unknown, b: unknown) =>
    JSON.stringify(a) !== JSON.stringify(b);
  async function save() {
    try {
      if (!title.trim()) throw new Error("Give this task a title.");
      const tags = [
        ...new Set(
          labels
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean),
        ),
      ];
      if (tags.length > 20 || tags.some((tag) => tag.length > 40))
        throw new Error(
          "Use at most 20 labels, with up to 40 characters each.",
        );
      if (people.length > 20 || agents.length > 10)
        throw new Error("A task can have up to 20 people and 10 agents.");
      const finalValues = {
        ...values,
        ...Object.fromEntries(
          Object.entries(numbers).map(([key, value]) => [
            key,
            value.trim() === "" ? null : Number(value),
          ]),
        ),
      };
      for (const field of board.fields) {
        const value = finalValues[String(field.id)];
        if (
          field.type === "number" &&
          value != null &&
          (typeof value !== "number" || !Number.isFinite(value))
        )
          throw new Error(`Enter a valid number for ${field.name}.`);
      }
      const updated = await action.run(async (client) => {
        if (!task)
          return client.tasks.create({
            board_id: board.id,
            title: title.trim(),
            description: description.trim(),
            column_id: column,
            ...(parentId
              ? { parent_task_id: parentId }
              : group
                ? { group_id: group }
                : {}),
            priority,
            due_at: due,
            labels: tags,
            assignee_user_ids: people,
            skill_ids: agents,
            custom_values: Object.fromEntries(
              Object.entries(finalValues).filter(
                (entry): entry is [string, TaskFieldValue] => entry[1] !== null,
              ),
            ),
          });
        const patch: TaskUpdatePayload = {};
        if (title.trim() !== task.title) patch.title = title.trim();
        if (description.trim() !== task.description)
          patch.description = description.trim();
        if (priority !== task.priority) patch.priority = priority;
        if (due !== task.due_at) {
          if (due) patch.due_at = due;
          else patch.clear_due_at = true;
        }
        if (!task.parent_task_id && group && group !== task.group_id)
          patch.group_id = group;
        if (changed(tags, task.labels)) patch.labels = tags;
        if (
          changed(
            people,
            task.assignees.map((person) => person.user_id),
          )
        )
          patch.assignee_user_ids = people;
        if (changed(agents, task.skills?.map((skill) => skill.skill_id) ?? []))
          patch.skill_ids = agents;
        const custom = Object.fromEntries(
          Object.entries(finalValues).filter(([key, value]) =>
            changed(value ?? null, task.custom_values[key] ?? null),
          ),
        );
        if (Object.keys(custom).length) patch.custom_values = custom;
        let result = Object.keys(patch).length
          ? await client.tasks.update(task.id, patch)
          : task;
        if (column && column !== task.column_id) {
          try {
            result = await client.tasks.move(task.id, { column_id: column });
          } catch (error) {
            throw new Error(
              `The details were saved, but the status could not change. ${error instanceof Error ? error.message : "Try changing status again."}`,
            );
          }
        }
        return result;
      });
      if (task) router.back();
      else router.replace(`/(tabs)/tasks/task/${updated.id}` as Href);
    } catch (error) {
      showError(error);
    }
  }
  return (
    <Page
      title={task ? "Edit task" : parentId ? "New subtask" : "New task"}
      subtitle={board.name}
    >
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.body}
      >
        {board.is_archived || task?.is_archived ? (
          <Text style={{ color: C.amber }}>
            Restore this board and task before editing.
          </Text>
        ) : null}
        <TaskInput
          label="Title"
          placeholder="What needs to happen?"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <TaskInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={20000}
          placeholder="Add a little context…"
        />
        <PickField
          label="Status"
          choices={board.columns.map((column) => ({
            value: String(column.id),
            label: column.name,
            color: column.color ?? undefined,
          }))}
          values={column ? [String(column)] : []}
          onChange={(values) => setColumn(Number(values[0]))}
        />
        {!parentId && !task?.parent_task_id ? (
          <PickField
            label="Group"
            choices={board.groups.map((group) => ({
              value: String(group.id),
              label: group.name,
            }))}
            values={group ? [String(group)] : []}
            onChange={(values) => setGroup(Number(values[0]))}
          />
        ) : null}
        <PickField
          label="Priority"
          choices={board.priority_labels.map((priority) => ({
            value: priority.key,
            label: priority.name,
            color: priority.color,
          }))}
          values={[priority]}
          onChange={(values) => setPriority(values[0])}
        />
        <DateField label="Due date" value={due} onChange={setDue} />
        {choicesError ? (
          <Text style={{ color: C.red, fontSize: 12 }}>
            Some assignment choices could not load. Existing assignments are
            preserved.
          </Text>
        ) : null}
        <PickField
          label="People"
          choices={memberChoices}
          values={people.map(String)}
          multiple
          onChange={(values) => setPeople(values.map(Number))}
        />
        <PickField
          label="Agents"
          choices={skillChoices}
          values={agents.map(String)}
          multiple
          onChange={(values) => setAgents(values.map(Number))}
        />
        <Text style={s.hint}>
          Assigned agents may start working when you save. Their questions and
          results appear on the task.
        </Text>
        <TaskInput
          label="Labels, separated by commas"
          value={labels}
          onChangeText={setLabels}
          maxLength={840}
        />
        {board.fields.length ? (
          <Section title="Board fields">
            {[...board.fields]
              .sort((a, b) => a.position - b.position)
              .map((field) => {
                const key = String(field.id);
                const value = values[key];
                const change = (value: TaskFieldValue | null) =>
                  setValues((old) => ({ ...old, [key]: value }));
                if (field.type === "date")
                  return (
                    <DateField
                      key={key}
                      label={field.name}
                      value={
                        typeof value === "string" && value
                          ? `${value}T12:00:00`
                          : null
                      }
                      onChange={(date) => change(date ? dayKey(date) : null)}
                    />
                  );
                if (field.type === "label")
                  return (
                    <PickField
                      key={key}
                      label={field.name}
                      choices={[
                        { value: "", label: "None" },
                        ...field.options.map((option) => ({
                          value: option.id,
                          label: option.name,
                          color: option.color,
                        })),
                      ]}
                      values={[typeof value === "string" ? value : ""]}
                      onChange={(selected) => change(selected[0] || null)}
                    />
                  );
                if (field.type === "people") {
                  const choices: Choice[] = [
                    ...memberChoices.map((choice) => ({
                      ...choice,
                      value: `user:${choice.value}`,
                    })),
                    ...skillChoices.map((choice) => ({
                      ...choice,
                      value: `agent:${choice.value}`,
                      label: `${choice.label} (agent)`,
                    })),
                  ];
                  const selected = Array.isArray(value)
                    ? value.map((person) => `${person.kind}:${person.id}`)
                    : [];
                  for (const person of selected)
                    if (!choices.some((choice) => choice.value === person))
                      choices.push({
                        value: person,
                        label: `${person.startsWith("agent:") ? "Previous agent" : "Former member"} #${person.split(":")[1]}`,
                      });
                  return (
                    <PickField
                      key={key}
                      label={field.name}
                      multiple
                      choices={choices}
                      values={selected}
                      onChange={(selected) =>
                        change(
                          selected.map(
                            (text) =>
                              ({
                                kind: text.split(":")[0],
                                id: Number(text.split(":")[1]),
                              }) as PersonRef,
                          ),
                        )
                      }
                    />
                  );
                }
                return (
                  <TaskInput
                    key={key}
                    label={field.name}
                    keyboardType={
                      field.type === "number" ? "decimal-pad" : "default"
                    }
                    value={
                      field.type === "number"
                        ? (numbers[key] ?? "")
                        : value == null
                          ? ""
                          : String(value)
                    }
                    maxLength={field.type === "text" ? 2000 : 100}
                    onChangeText={(text) =>
                      field.type === "number"
                        ? setNumbers((old) => ({ ...old, [key]: text }))
                        : change(text === "" ? null : text)
                    }
                  />
                );
              })}
          </Section>
        ) : null}
        <Action
          title={
            task ? "Save changes" : parentId ? "Create subtask" : "Create task"
          }
          busy={action.busy}
          disabled={!title.trim() || board.is_archived || !!task?.is_archived}
          onPress={() => {
            void save();
          }}
        />
      </KeyboardAwareScrollView>
    </Page>
  );
}
