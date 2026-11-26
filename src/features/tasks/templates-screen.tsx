import { useState } from "react";
import { Alert, FlatList, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";
import { C } from "@/components/ui";
import { useTaskAction, useTaskQuery, useTaskWorkspace } from "./provider";
import { defaultPriorities } from "./model";
import {
  Action,
  Busy,
  Chip,
  Empty,
  Failure,
  Page,
  PickField,
  Section,
  Sheet,
  TaskIconButton,
  TaskInput,
  confirmAction,
  s,
  showError,
} from "./ui";
import { StructureForm, type StructureDraft } from "./structure-form";
import type {
  TaskBoardTemplateDefinition,
  TaskBoardTemplateDetail,
  TaskBoardTemplateTask,
} from "./types";

export function TemplatesScreen() {
  const router = useRouter();
  const context = useTaskWorkspace();
  const templates = useTaskQuery(["templates"], (client) =>
    client.boards.listTemplates(),
  );
  const [search, setSearch] = useState("");
  return (
    <Page
      title="Board templates"
      subtitle="A head start, made your own."
      actions={
        <TaskIconButton
          icon="add"
          label="Create template"
          onPress={() => router.push("/(tabs)/tasks/template/new" as Href)}
        />
      }
    >
      <View style={{ padding: 22 }}>
        <TaskInput
          label="Find a template"
          value={search}
          onChangeText={setSearch}
          placeholder="Search templates…"
        />
      </View>
      {context.loading || templates.isPending ? (
        <Busy />
      ) : templates.isError ? (
        <Failure
          error={templates.error}
          retry={() => {
            void templates.refetch();
          }}
        />
      ) : (
        <FlatList
          data={templates.data.filter((template) =>
            `${template.name} ${template.description}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )}
          keyExtractor={(template) => template.key}
          contentContainerStyle={{
            padding: 22,
            paddingTop: 0,
            gap: 14,
            paddingBottom: 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={templates.isRefetching}
              onRefresh={() => {
                void templates.refetch();
              }}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <Empty
              title="No templates match"
              message="Save a board as a template, or create one here."
            />
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.title}>{item.name}</Text>
              <Text style={s.hint}>
                {item.is_builtin ? "Built-in template" : "Workspace template"} ·{" "}
                {item.task_count} tasks
              </Text>
              {item.description ? (
                <Text style={s.hint}>{item.description}</Text>
              ) : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.groups.slice(0, 4).map((group) => (
                  <Chip key={group} label={group} />
                ))}
              </View>
              <Action
                title="Preview template"
                secondary
                onPress={() =>
                  router.push(
                    `/(tabs)/tasks/template/${encodeURIComponent(item.key)}` as Href,
                  )
                }
              />
            </View>
          )}
        />
      )}
    </Page>
  );
}

const blankDefinition: TaskBoardTemplateDefinition = {
  columns: [
    { name: "To do", category: "backlog", color: C.moss },
    { name: "In progress", category: "active", color: C.primary },
    { name: "Done", category: "done", color: C.green },
  ],
  groups: [{ name: "General" }],
  fields: [],
  tasks: [],
};
export function TemplateScreen() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const isNew = key === "new";
  const context = useTaskWorkspace();
  const template = useTaskQuery(
    ["template", key],
    (client) => client.boards.getTemplate(key!),
    false,
    !!key && !isNew,
  );
  if (!key)
    return (
      <Page title="Template">
        <Empty title="Invalid template link" />
      </Page>
    );
  if (!isNew && (context.loading || template.isPending))
    return (
      <Page title="Template">
        <Busy />
      </Page>
    );
  if (!isNew && template.isError)
    return (
      <Page title="Template">
        <Failure
          error={template.error}
          retry={() => {
            void template.refetch();
          }}
        />
      </Page>
    );
  return (
    <TemplateEditor
      key={`${context.workspace?.id}-${key}`}
      template={template.data}
    />
  );
}
function TemplateEditor({ template }: { template?: TaskBoardTemplateDetail }) {
  const router = useRouter();
  const action = useTaskAction();
  const canEdit = !template || template.can_edit;
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [definition, setDefinition] = useState<TaskBoardTemplateDefinition>(
    () => JSON.parse(JSON.stringify(template?.definition ?? blankDefinition)),
  );
  const [editor, setEditor] = useState<{
    kind: "column" | "group" | "field";
    index?: number;
  } | null>(null);
  const [taskEditor, setTaskEditor] = useState<{ index?: number } | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [boardName, setBoardName] = useState(template?.name ?? "");
  const collections = {
    column: "columns",
    group: "groups",
    field: "fields",
  } as const;
  function saveStructure(draft: StructureDraft) {
    if (!editor) return;
    const { kind, index } = editor;
    const key = collections[kind];
    const rows = definition[key];
    if (
      rows.some(
        (row, rowIndex) =>
          row.name.toLowerCase() === draft.name.toLowerCase() &&
          rowIndex !== index,
      )
    ) {
      showError(new Error("Use a different name for each item."));
      return;
    }
    setDefinition((old) => {
      const next = { ...old };
      const previous = index !== undefined ? old[key][index].name : null;
      const value =
        kind === "column"
          ? { name: draft.name, category: draft.category, color: draft.color }
          : kind === "group"
            ? { name: draft.name, color: draft.color }
            : {
                name: draft.name,
                type: draft.type,
                options: draft.options.map((option) => ({
                  name: option.name,
                  color: option.color,
                })),
              };
      // The key/value relationship is known from kind; keep the wire contract free of UI ids.
      Object.assign(next, {
        [key]:
          index === undefined
            ? [...old[key], value]
            : old[key].map((row, rowIndex) =>
                rowIndex === index ? value : row,
              ),
      });
      if (previous && kind !== "field")
        next.tasks = old.tasks.map((task) => ({
          ...task,
          ...(kind === "column" && task.column === previous
            ? { column: draft.name }
            : {}),
          ...(kind === "group" && task.group === previous
            ? { group: draft.name }
            : {}),
        }));
      return next;
    });
    setEditor(null);
  }
  function remove(kind: "column" | "group" | "field", index: number) {
    confirmAction(
      "Remove this template item?",
      "Task references to a removed status or group will use the first remaining one.",
      () =>
        setDefinition((old) => {
          const key = collections[kind];
          const name = old[key][index].name;
          const rows = old[key].filter((_row, rowIndex) => rowIndex !== index);
          const next = { ...old, [key]: rows };
          if (kind !== "field")
            next.tasks = old.tasks.map((task) => ({
              ...task,
              ...(kind === "column" && task.column === name
                ? { column: rows[0]?.name ?? null }
                : {}),
              ...(kind === "group" && task.group === name
                ? { group: rows[0]?.name ?? null }
                : {}),
            }));
          return next;
        }),
    );
  }
  async function save(copy = false) {
    try {
      if (!name.trim()) throw new Error("Give the template a name.");
      if (definition.tasks.length > 200)
        throw new Error("A template can contain at most 200 tasks.");
      const payload = {
        name: copy ? `${name.trim()} (copy)`.slice(0, 200) : name.trim(),
        description: description.trim(),
        icon: template?.icon,
        definition,
      };
      const updated = await action.run((client) =>
        template?.id && !copy
          ? client.boards.updateTemplate(template.id, payload)
          : client.boards.createTemplate(payload),
      );
      if (!template || copy)
        router.replace(
          `/(tabs)/tasks/template/${encodeURIComponent(updated.key)}` as Href,
        );
      else Alert.alert("Saved", "Your template has been updated.");
    } catch (error) {
      showError(error);
    }
  }
  const initial =
    editor && editor.index !== undefined
      ? definition[collections[editor.kind]][editor.index]
      : undefined;
  return (
    <Page
      title={template ? "Template" : "New template"}
      subtitle={
        template?.is_builtin
          ? "Built-in · duplicate to customize"
          : "Saved to your workspace"
      }
    >
      <NestableScrollContainer
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.body}
      >
        <TaskInput
          label="Name"
          value={name}
          editable={canEdit}
          onChangeText={setName}
          maxLength={200}
        />
        <TaskInput
          label="Description"
          value={description}
          editable={canEdit}
          onChangeText={setDescription}
          multiline
          maxLength={20000}
        />
        {template ? (
          <Action
            title="Use this template"
            onPress={() => {
              setBoardName(template.name);
              setCreatingBoard(true);
            }}
          />
        ) : null}
        {(["column", "group", "field"] as const).map((kind) => {
          const rows = definition[collections[kind]];
          return (
            <Section
              key={kind}
              title={
                kind === "column"
                  ? "Statuses"
                  : kind === "group"
                    ? "Groups"
                    : "Custom fields"
              }
            >
              {rows.length ? (
                <View style={{ height: Math.min(rows.length * 72, 300) }}>
                  <NestableDraggableFlatList
                    data={rows.map((row, index) => ({
                      id: row.name,
                      row,
                      index,
                    }))}
                    keyExtractor={(row) => row.id}
                    onDragEnd={({ data }) =>
                      setDefinition((old) => ({
                        ...old,
                        [collections[kind]]: data.map((item) => item.row),
                      }))
                    }
                    renderItem={({ item, drag }) => (
                      <View style={[s.pick, { marginBottom: 8 }]}>
                        <Text
                          onLongPress={
                            canEdit && !action.busy ? drag : undefined
                          }
                          style={{ color: C.moss, padding: 7 }}
                        >
                          ☰
                        </Text>
                        <Text style={{ flex: 1, color: C.ink }}>
                          {item.row.name}
                        </Text>
                        {canEdit ? (
                          <>
                            <TaskIconButton
                              icon="create-outline"
                              label={`Edit ${item.row.name}`}
                              onPress={() =>
                                setEditor({ kind, index: item.index })
                              }
                            />
                            <TaskIconButton
                              icon="trash-outline"
                              label={`Remove ${item.row.name}`}
                              disabled={kind !== "field" && rows.length <= 1}
                              onPress={() => remove(kind, item.index)}
                            />
                          </>
                        ) : null}
                      </View>
                    )}
                  />
                </View>
              ) : (
                <Text style={s.hint}>No custom fields.</Text>
              )}
              {canEdit ? (
                <Action
                  title={`Add ${kind === "column" ? "status" : kind}`}
                  secondary
                  onPress={() => setEditor({ kind })}
                />
              ) : null}
            </Section>
          );
        })}
        <Section title={`Tasks · ${definition.tasks.length}`}>
          {definition.tasks.map((task, index) => (
            <View key={`${index}-${task.title}`} style={s.card}>
              <Text style={{ color: C.ink, fontWeight: "600" }}>
                {task.title}
              </Text>
              <Text style={s.hint}>
                {task.group ?? definition.groups[0]?.name ?? "General"} ·{" "}
                {task.column ?? definition.columns[0]?.name ?? "To do"}
              </Text>
              {task.description ? (
                <Text numberOfLines={3} style={s.hint}>
                  {task.description}
                </Text>
              ) : null}
              {canEdit ? (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TaskIconButton
                    icon="arrow-up"
                    label={`Move ${task.title} up`}
                    disabled={index === 0}
                    onPress={() =>
                      setDefinition((old) => {
                        const tasks = [...old.tasks];
                        [tasks[index - 1], tasks[index]] = [
                          tasks[index],
                          tasks[index - 1],
                        ];
                        return { ...old, tasks };
                      })
                    }
                  />
                  <TaskIconButton
                    icon="arrow-down"
                    label={`Move ${task.title} down`}
                    disabled={index === definition.tasks.length - 1}
                    onPress={() =>
                      setDefinition((old) => {
                        const tasks = [...old.tasks];
                        [tasks[index + 1], tasks[index]] = [
                          tasks[index],
                          tasks[index + 1],
                        ];
                        return { ...old, tasks };
                      })
                    }
                  />
                  <TaskIconButton
                    icon="create-outline"
                    label={`Edit ${task.title}`}
                    onPress={() => setTaskEditor({ index })}
                  />
                  <TaskIconButton
                    icon="trash-outline"
                    label={`Remove ${task.title}`}
                    onPress={() =>
                      confirmAction(
                        "Remove this template task?",
                        "The saved template changes when you press Save.",
                        () =>
                          setDefinition((old) => ({
                            ...old,
                            tasks: old.tasks.filter(
                              (_task, row) => row !== index,
                            ),
                          })),
                      )
                    }
                  />
                </View>
              ) : null}
            </View>
          ))}
          {canEdit ? (
            <Action
              title="Add template task"
              secondary
              disabled={definition.tasks.length >= 200}
              onPress={() => setTaskEditor({})}
            />
          ) : null}
        </Section>
        {canEdit ? (
          <Action
            title="Save template"
            busy={action.busy}
            disabled={!name.trim()}
            onPress={() => {
              void save();
            }}
          />
        ) : null}
        {template ? (
          <Action
            title="Duplicate template"
            secondary
            busy={action.busy}
            onPress={() => {
              void save(true);
            }}
          />
        ) : null}
        {template?.can_delete && template.id ? (
          <Action
            title="Delete template"
            secondary
            danger
            busy={action.busy}
            onPress={() =>
              confirmAction(
                "Delete this template?",
                "Existing boards made from it will be kept.",
                () => {
                  void action
                    .run((client) => client.boards.removeTemplate(template.id!))
                    .then(() =>
                      router.dismissTo("/(tabs)/tasks/templates" as Href),
                    )
                    .catch(showError);
                },
              )
            }
          />
        ) : null}
      </NestableScrollContainer>
      {editor ? (
        <StructureForm
          kind={editor.kind}
          initial={
            initial
              ? {
                  ...initial,
                  color:
                    "color" in initial
                      ? (initial.color ?? C.primary)
                      : C.primary,
                }
              : undefined
          }
          editing={editor.index !== undefined}
          busy={false}
          onClose={() => setEditor(null)}
          onSave={saveStructure}
        />
      ) : null}
      {taskEditor ? (
        <TemplateTaskForm
          initial={
            taskEditor.index !== undefined
              ? definition.tasks[taskEditor.index]
              : undefined
          }
          definition={definition}
          onClose={() => setTaskEditor(null)}
          onSave={(task) => {
            const index = taskEditor.index;
            setDefinition((old) => ({
              ...old,
              tasks:
                index === undefined
                  ? [...old.tasks, task]
                  : old.tasks.map((oldTask, row) =>
                      row === index ? task : oldTask,
                    ),
            }));
            setTaskEditor(null);
          }}
        />
      ) : null}
      {creatingBoard && template ? (
        <Sheet
          title="Make it your board"
          busy={action.busy}
          onClose={() => setCreatingBoard(false)}
        >
          <TaskInput
            label="Board name"
            value={boardName}
            onChangeText={setBoardName}
            maxLength={200}
          />
          <Text style={s.hint}>
            Creates a new board from the saved template. Save any template edits
            first.
          </Text>
          <Action
            title="Create board"
            busy={action.busy}
            disabled={!boardName.trim()}
            onPress={() => {
              void action
                .run((client) =>
                  client.boards.createFromTemplate({
                    template_key: template.key,
                    name: boardName.trim(),
                  }),
                )
                .then((board) => {
                  setCreatingBoard(false);
                  router.push(`/(tabs)/tasks/board/${board.id}` as Href);
                })
                .catch(showError);
            }}
          />
        </Sheet>
      ) : null}
    </Page>
  );
}
function TemplateTaskForm({
  initial,
  definition,
  onClose,
  onSave,
}: {
  initial?: TaskBoardTemplateTask;
  definition: TaskBoardTemplateDefinition;
  onClose: () => void;
  onSave: (task: TaskBoardTemplateTask) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [group, setGroup] = useState(
    initial?.group ?? definition.groups[0]?.name ?? "",
  );
  const [column, setColumn] = useState(
    initial?.column ?? definition.columns[0]?.name ?? "",
  );
  const [priority, setPriority] = useState(initial?.priority ?? "medium");
  return (
    <Sheet
      title={initial ? "Edit template task" : "New template task"}
      onClose={onClose}
    >
      <TaskInput
        label="Title"
        value={title}
        maxLength={200}
        onChangeText={setTitle}
      />
      <TaskInput
        label="Description"
        multiline
        value={description}
        maxLength={20000}
        onChangeText={setDescription}
      />
      <PickField
        label="Group"
        choices={definition.groups.map((group) => ({
          value: group.name,
          label: group.name,
        }))}
        values={[group]}
        onChange={(values) => setGroup(values[0])}
      />
      <PickField
        label="Status"
        choices={definition.columns.map((column) => ({
          value: column.name,
          label: column.name,
        }))}
        values={[column]}
        onChange={(values) => setColumn(values[0])}
      />
      <PickField
        label="Priority"
        choices={defaultPriorities.map((priority) => ({
          value: priority.key,
          label: priority.name,
          color: priority.color,
        }))}
        values={[priority]}
        onChange={(values) => setPriority(values[0])}
      />
      <Action
        title="Keep task"
        disabled={!title.trim()}
        onPress={() =>
          onSave({
            title: title.trim(),
            description: description.trim(),
            group: group || null,
            column: column || null,
            priority,
          })
        }
      />
    </Sheet>
  );
}
