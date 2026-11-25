import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { C } from "@/components/ui";
import type { TaskColumnCategory, TaskFieldType } from "./types";
import { Action, PickField, Sheet, TaskInput, confirmAction, s } from "./ui";

export type StructureKind = "column" | "group" | "field" | "priority";
export type StructureDraft = {
  name: string;
  color: string;
  category: TaskColumnCategory;
  type: TaskFieldType;
  options: { id?: string; name: string; color: string }[];
};
export const fieldTypes: TaskFieldType[] = [
  "text",
  "number",
  "date",
  "label",
  "people",
];
export function StructureForm({
  kind,
  initial,
  onClose,
  onSave,
  busy,
  editing = false,
}: {
  kind: StructureKind;
  initial?: Partial<StructureDraft>;
  onClose: () => void;
  onSave: (draft: StructureDraft) => void;
  busy: boolean;
  editing?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<string>(initial?.color ?? C.primary);
  const [category, setCategory] = useState<TaskColumnCategory>(
    initial?.category ?? "backlog",
  );
  const [type, setType] = useState<TaskFieldType>(initial?.type ?? "text");
  const [options, setOptions] = useState(
    initial?.options?.map((option) => ({ ...option })) ?? [],
  );
  const validColor = /^#[0-9a-f]{6}$/i.test(color);
  const validOptions = options.every(
    (option) => option.name.trim() && /^#[0-9a-f]{6}$/i.test(option.color),
  );
  return (
    <Sheet
      title={`${editing ? "Edit" : "Add"} ${kind === "column" ? "status" : kind}`}
      onClose={onClose}
      busy={busy}
    >
      <TaskInput
        label="Name"
        value={name}
        onChangeText={setName}
        maxLength={kind === "field" ? 60 : 200}
      />
      {kind === "column" ? (
        <PickField
          label="Category"
          choices={[
            { value: "backlog", label: "Backlog / to do" },
            { value: "active", label: "Active / in progress" },
            { value: "done", label: "Done" },
          ]}
          values={[category]}
          onChange={(values) => setCategory(values[0] as TaskColumnCategory)}
        />
      ) : null}
      {kind !== "field" ? (
        <ColorField value={color} onChange={setColor} />
      ) : (
        <PickField
          label="Field type"
          disabled={editing}
          choices={fieldTypes.map((type) => ({
            value: type,
            label: type[0].toUpperCase() + type.slice(1),
          }))}
          values={[type]}
          onChange={(values) => setType(values[0] as TaskFieldType)}
        />
      )}
      {kind === "field" && type === "label" ? (
        <View style={{ gap: 14 }}>
          <Text style={s.hint}>
            Removing an existing option clears that value on tasks using it.
          </Text>
          {options.map((option, index) => (
            <View
              key={option.id ?? `new-${index}`}
              style={[s.card, { padding: 12 }]}
            >
              <TaskInput
                label={`Option ${index + 1}`}
                value={option.name}
                maxLength={60}
                onChangeText={(name) =>
                  setOptions((old) =>
                    old.map((value, row) =>
                      row === index ? { ...value, name } : value,
                    ),
                  )
                }
              />
              <ColorField
                value={option.color}
                onChange={(color) =>
                  setOptions((old) =>
                    old.map((value, row) =>
                      row === index ? { ...value, color } : value,
                    ),
                  )
                }
              />
              <Action
                title="Remove option"
                secondary
                danger
                onPress={() =>
                  confirmAction(
                    "Remove this option?",
                    "Tasks using this option will have that field cleared when you save.",
                    () =>
                      setOptions((old) =>
                        old.filter((_value, row) => row !== index),
                      ),
                  )
                }
              />
            </View>
          ))}
          <Action
            title="Add label option"
            secondary
            disabled={options.length >= 50}
            onPress={() =>
              setOptions((old) => [...old, { name: "", color: C.primary }])
            }
          />
        </View>
      ) : null}
      {!validColor && kind !== "field" ? (
        <Text style={{ color: C.red }}>
          Use a six-digit hex color, for example #713F52.
        </Text>
      ) : null}
      <Action
        title="Save"
        busy={busy}
        disabled={
          !name.trim() ||
          (kind !== "field" && !validColor) ||
          (kind === "field" && type === "label" && !validOptions)
        }
        onPress={() =>
          onSave({
            name: name.trim(),
            color,
            category,
            type,
            options:
              type === "label"
                ? options.map((option) => ({
                    ...option,
                    name: option.name.trim(),
                  }))
                : [],
          })
        }
      />
    </Sheet>
  );
}
export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.label}>Color</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        {[
          C.primary,
          C.green,
          C.coral,
          C.amber,
          C.moss,
          "#3b82f6",
          "#8b5cf6",
          "#ef4444",
        ].map((color) => (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={color}
            accessibilityState={{ checked: value === color }}
            onPress={() => onChange(color)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: color,
                borderWidth: value === color ? 3 : 0,
                borderColor: C.ink,
              }}
            />
          </Pressable>
        ))}
      </View>
      <TaskInput
        label="Hex color"
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        maxLength={7}
      />
    </View>
  );
}
