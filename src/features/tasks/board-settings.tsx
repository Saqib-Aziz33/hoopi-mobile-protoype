import { useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";
import { C } from "@/components/ui";
import { numericId } from "./model";
import { useTaskAction, useTaskQuery, useTaskWorkspace } from "./provider";
import {
  Action,
  Busy,
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
import {
  StructureForm,
  type StructureDraft,
  type StructureKind,
} from "./structure-form";
import type { TaskBoardDetail } from "./types";

export function BoardSettingsScreen() {
  const { boardId: raw } = useLocalSearchParams<{ boardId?: string }>();
  const id = numericId(raw);
  const context = useTaskWorkspace();
  const query = useTaskQuery(
    ["board", id],
    (client) => client.boards.get(id!),
    false,
    id !== null,
  );
  if (!id)
    return (
      <Page title="Board settings">
        <Empty title="Invalid board" />
      </Page>
    );
  if (context.loading || query.isPending)
    return (
      <Page title="Board settings">
        <Busy />
      </Page>
    );
  if (query.isError || !query.data)
    return (
      <Page title="Board settings">
        <Failure
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      </Page>
    );
  return (
    <SettingsForm key={`${context.workspace?.id}-${id}`} board={query.data} />
  );
}
function SettingsForm({ board }: { board: TaskBoardDetail }) {
  const router = useRouter();
  const action = useTaskAction();
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description);
  const [coverage, setCoverage] = useState(board.auto_ai_coverage ?? false);
  const [editor, setEditor] = useState<{
    kind: StructureKind;
    id?: number | string;
  } | null>(null);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(board.name);
  const [removeGroup, setRemoveGroup] = useState<number | null>(null);
  const [moveGroup, setMoveGroup] = useState<number | null>(null);
  const [removePriority, setRemovePriority] = useState<string | null>(null);
  const [replacement, setReplacement] = useState<string>("");
  const column =
    editor?.kind === "column"
      ? board.columns.find((column) => column.id === editor.id)
      : undefined;
  const group =
    editor?.kind === "group"
      ? board.groups.find((group) => group.id === editor.id)
      : undefined;
  const field =
    editor?.kind === "field"
      ? board.fields.find((field) => field.id === editor.id)
      : undefined;
  const priority =
    editor?.kind === "priority"
      ? board.priority_labels.find((priority) => priority.key === editor.id)
      : undefined;
  async function saveStructure(draft: StructureDraft) {
    if (!editor) return;
    try {
      await action.run((client) => {
        if (editor.kind === "column")
          return column
            ? client.boards.updateColumn(board.id, column.id, {
                name: draft.name,
                color: draft.color,
                category: draft.category,
              })
            : client.boards.createColumn(board.id, {
                name: draft.name,
                color: draft.color,
                category: draft.category,
              });
        if (editor.kind === "group")
          return group
            ? client.boards.updateGroup(board.id, group.id, {
                name: draft.name,
                color: draft.color,
              })
            : client.boards.createGroup(board.id, {
                name: draft.name,
                color: draft.color,
              });
        if (editor.kind === "field")
          return field
            ? client.boards.updateField(board.id, field.id, {
                name: draft.name,
                options: draft.options,
              })
            : client.boards.createField(board.id, {
                name: draft.name,
                type: draft.type,
                options: draft.options,
              });
        const labels = priority
          ? board.priority_labels.map((value) =>
              value.key === priority.key
                ? { ...value, name: draft.name, color: draft.color }
                : value,
            )
          : [
              ...board.priority_labels,
              { name: draft.name, color: draft.color },
            ];
        return client.boards.update(board.id, { priority_labels: labels });
      });
      setEditor(null);
    } catch (error) {
      showError(error);
    }
  }
  async function reorder(kind: StructureKind, values: (number | string)[]) {
    try {
      await action.run((client) =>
        kind === "column"
          ? client.boards.reorderColumns(board.id, values as number[])
          : kind === "group"
            ? client.boards.reorderGroups(board.id, values as number[])
            : kind === "field"
              ? client.boards.reorderFields(board.id, values as number[])
              : client.boards.update(board.id, {
                  priority_labels: values.map(
                    (key) =>
                      board.priority_labels.find((label) => label.key === key)!,
                  ),
                }),
      );
    } catch (error) {
      showError(error);
    }
  }
  return (
    <Page title="Board settings" subtitle={board.name}>
      <NestableScrollContainer
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.body}
      >
        <TaskInput
          label="Board name"
          value={name}
          onChangeText={setName}
          maxLength={200}
        />
        <TaskInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={20000}
        />
        <View style={s.pick}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: C.ink }}>Automatic AI coverage</Text>
            <Text style={s.hint}>
              Evaluate how agents can help with tasks on this board.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Automatic AI coverage"
            value={coverage}
            onValueChange={setCoverage}
            trackColor={{ true: C.primary }}
          />
        </View>
        <Action
          title="Save board details"
          busy={action.busy}
          disabled={!name.trim() || board.is_archived}
          onPress={() => {
            void action
              .run((client) =>
                client.boards.update(board.id, {
                  name: name.trim(),
                  description: description.trim(),
                  auto_ai_coverage: coverage,
                }),
              )
              .then(() =>
                Alert.alert("Saved", "Your board details have been updated."),
              )
              .catch(showError);
          }}
        />
        <Text style={s.hint}>
          Hold a row to reorder it. Priority order runs from lowest to highest.
        </Text>
        {(
          [
            {
              kind: "column",
              title: "Statuses",
              rows: board.columns.map((row) => ({
                id: row.id,
                name: row.name,
                color: row.color,
                note: `${row.category} · ${row.task_count} tasks`,
              })),
            },
            {
              kind: "group",
              title: "Groups",
              rows: board.groups.map((row) => ({
                id: row.id,
                name: row.name,
                color: row.color,
                note: `${row.task_count} tasks`,
              })),
            },
            {
              kind: "field",
              title: "Custom fields",
              rows: board.fields.map((row) => ({
                id: row.id,
                name: row.name,
                color: C.primary,
                note: row.type,
              })),
            },
            {
              kind: "priority",
              title: "Priorities",
              rows: board.priority_labels.map((row) => ({
                id: row.key,
                name: row.name,
                color: row.color,
                note: "",
              })),
            },
          ] as {
            kind: StructureKind;
            title: string;
            rows: {
              id: number | string;
              name: string;
              color: string | null;
              note: string;
            }[];
          }[]
        ).map((collection) => (
          <Section key={collection.kind} title={collection.title}>
            {collection.rows.length ? (
              <View
                style={{ height: Math.min(collection.rows.length * 76, 320) }}
              >
                <NestableDraggableFlatList
                  data={collection.rows}
                  keyExtractor={(row) => String(row.id)}
                  activationDistance={8}
                  onDragEnd={({ data, from, to }) => {
                    if (from !== to)
                      void reorder(
                        collection.kind,
                        data.map((row) => row.id),
                      );
                  }}
                  renderItem={({ item: row, drag }) => (
                    <View style={[s.pick, { marginBottom: 8, minHeight: 66 }]}>
                      <Text
                        onLongPress={
                          !board.is_archived && !action.busy ? drag : undefined
                        }
                        style={{ color: row.color ?? C.primary, padding: 5 }}
                      >
                        ☰
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.ink }}>{row.name}</Text>
                        {row.note ? (
                          <Text style={s.hint}>{row.note}</Text>
                        ) : null}
                      </View>
                      <TaskIconButton
                        icon="create-outline"
                        label={`Edit ${row.name}`}
                        disabled={board.is_archived || action.busy}
                        onPress={() =>
                          setEditor({ kind: collection.kind, id: row.id })
                        }
                      />
                      <TaskIconButton
                        icon="trash-outline"
                        label={`Remove ${row.name}`}
                        disabled={
                          board.is_archived ||
                          action.busy ||
                          (collection.kind !== "field" &&
                            collection.rows.length <= 1)
                        }
                        onPress={() => {
                          if (collection.kind === "group") {
                            setRemoveGroup(Number(row.id));
                            setMoveGroup(
                              board.groups.find((group) => group.id !== row.id)
                                ?.id ?? null,
                            );
                            return;
                          }
                          if (collection.kind === "priority") {
                            setRemovePriority(String(row.id));
                            setReplacement(
                              board.priority_labels.find(
                                (priority) => priority.key !== row.id,
                              )?.key ?? "",
                            );
                            return;
                          }
                          confirmAction(
                            `Remove ${row.name}?`,
                            collection.kind === "field"
                              ? "This field and its task values will be removed from this board."
                              : "A status can only be removed when it has no tasks.",
                            () => {
                              void action
                                .run((client) =>
                                  collection.kind === "field"
                                    ? client.boards.removeField(
                                        board.id,
                                        Number(row.id),
                                      )
                                    : client.boards.removeColumn(
                                        board.id,
                                        Number(row.id),
                                      ),
                                )
                                .catch(showError);
                            },
                          );
                        }}
                      />
                    </View>
                  )}
                />
              </View>
            ) : (
              <Text style={s.hint}>None yet.</Text>
            )}
            <Action
              title={`Add ${collection.kind === "column" ? "status" : collection.kind}`}
              secondary
              disabled={board.is_archived || action.busy}
              onPress={() => setEditor({ kind: collection.kind })}
            />
          </Section>
        ))}
        <Section title="Board actions">
          <Action
            title="Save as template"
            secondary
            disabled={board.is_archived}
            onPress={() => setSaveTemplate(true)}
          />
          <Action
            title={board.is_archived ? "Restore board" : "Archive board"}
            secondary
            busy={action.busy}
            onPress={() =>
              confirmAction(
                board.is_archived
                  ? "Restore this board?"
                  : "Archive this board?",
                board.is_archived
                  ? "It will be available in your active boards."
                  : "You can restore it later from Archived boards.",
                () => {
                  void action
                    .run((client) =>
                      client.boards.update(board.id, {
                        is_archived: !board.is_archived,
                      }),
                    )
                    .then(() => router.dismissTo("/(tabs)/tasks" as Href))
                    .catch(showError);
                },
                !board.is_archived,
              )
            }
          />
          <Action
            title="Delete board permanently"
            secondary
            danger
            busy={action.busy}
            onPress={() =>
              confirmAction(
                "Permanently delete this board?",
                "All its tasks, subtasks, fields, comments, and history will be removed. Only its creator or a workspace admin can delete it.",
                () => {
                  void action
                    .run((client) => client.boards.remove(board.id))
                    .then(() => router.dismissTo("/(tabs)/tasks" as Href))
                    .catch(showError);
                },
              )
            }
          />
        </Section>
      </NestableScrollContainer>
      {editor ? (
        <StructureForm
          kind={editor.kind}
          editing={editor.id !== undefined}
          initial={
            column
              ? {
                  name: column.name,
                  color: column.color ?? C.primary,
                  category: column.category,
                }
              : group
                ? { name: group.name, color: group.color ?? C.primary }
                : field
                  ? {
                      name: field.name,
                      type: field.type,
                      options: field.options,
                    }
                  : priority
                    ? { name: priority.name, color: priority.color }
                    : undefined
          }
          busy={action.busy}
          onClose={() => setEditor(null)}
          onSave={(draft) => {
            void saveStructure(draft);
          }}
        />
      ) : null}
      {removeGroup ? (
        <Sheet
          title="Remove group"
          busy={action.busy}
          onClose={() => setRemoveGroup(null)}
        >
          <Text style={s.hint}>
            Move this group’s tasks to another group before removing it.
          </Text>
          <PickField
            label="Move tasks to"
            choices={board.groups
              .filter((group) => group.id !== removeGroup)
              .map((group) => ({ value: String(group.id), label: group.name }))}
            values={moveGroup ? [String(moveGroup)] : []}
            onChange={(values) => setMoveGroup(Number(values[0]))}
          />
          <Action
            title="Move tasks and remove group"
            danger
            busy={action.busy}
            disabled={!moveGroup}
            onPress={() => {
              void action
                .run((client) =>
                  client.boards.removeGroup(
                    board.id,
                    removeGroup,
                    moveGroup ?? undefined,
                  ),
                )
                .then(() => setRemoveGroup(null))
                .catch(showError);
            }}
          />
        </Sheet>
      ) : null}
      {removePriority ? (
        <Sheet
          title="Remove priority"
          busy={action.busy}
          onClose={() => setRemovePriority(null)}
        >
          <Text style={s.hint}>
            Choose the priority to use for tasks with this priority.
          </Text>
          <PickField
            label="Replacement"
            choices={board.priority_labels
              .filter((priority) => priority.key !== removePriority)
              .map((priority) => ({
                value: priority.key,
                label: priority.name,
                color: priority.color,
              }))}
            values={[replacement]}
            onChange={(values) => setReplacement(values[0])}
          />
          <Action
            title="Replace and remove priority"
            danger
            busy={action.busy}
            disabled={!replacement}
            onPress={() => {
              void action
                .run((client) =>
                  client.boards.update(board.id, {
                    priority_labels: board.priority_labels.filter(
                      (priority) => priority.key !== removePriority,
                    ),
                    priority_replacements: { [removePriority]: replacement },
                  }),
                )
                .then(() => setRemovePriority(null))
                .catch(showError);
            }}
          />
        </Sheet>
      ) : null}
      {saveTemplate ? (
        <Sheet
          title="Save as template"
          busy={action.busy}
          onClose={() => setSaveTemplate(false)}
        >
          <TaskInput
            label="Template name"
            value={templateName}
            maxLength={200}
            onChangeText={setTemplateName}
          />
          <Text style={s.hint}>
            Keeps the board’s structure and open tasks, without assignment to
            people.
          </Text>
          <Action
            title="Save template"
            busy={action.busy}
            disabled={!templateName.trim()}
            onPress={() => {
              void action
                .run((client) =>
                  client.boards.saveAsTemplate(board.id, {
                    name: templateName.trim(),
                  }),
                )
                .then(() => {
                  setSaveTemplate(false);
                  Alert.alert(
                    "Template saved",
                    "You can find it under Tasks → Templates.",
                  );
                })
                .catch(showError);
            }}
          />
        </Sheet>
      ) : null}
    </Page>
  );
}
