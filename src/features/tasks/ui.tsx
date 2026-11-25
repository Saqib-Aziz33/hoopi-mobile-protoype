import { useOptionalTaskWorkspace } from "./provider";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { C, Screen, editorialFont } from "@/components/ui";
import { ErrorNotice } from "@/components/error-notice";

type IconName = keyof typeof Ionicons.glyphMap;
export function TaskIconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? C.lavender : "transparent",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={C.primary} />
    </Pressable>
  );
}
export function Page({
  title,
  subtitle,
  back = true,
  actions,
  children,
}: React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  back?: boolean;
  actions?: React.ReactNode;
}>) {
  const router = useRouter();
  const workspace = useOptionalTaskWorkspace();
  const content =
    workspace && !workspace.workspace ? (
      workspace.loading ? (
        <Busy />
      ) : workspace.error ? (
        <Failure error={new Error(workspace.error)} retry={workspace.refresh} />
      ) : (
        <Empty
          title="No workspace available"
          message="Join a workspace to use Tasks."
        />
      )
    ) : (
      children
    );
  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={s.header}>
        {back ? (
          <TaskIconButton
            icon="arrow-back"
            label="Go back"
            onPress={() => router.back()}
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" numberOfLines={2} style={s.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={s.hint}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions}
      </View>
      {content}
    </Screen>
  );
}
export function Busy() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={C.primary} />
      <Text style={[s.hint, { marginTop: 12 }]}>Opening your workspace…</Text>
    </View>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <View style={{ padding: 24 }}>
      <ErrorNotice
        message={
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."
        }
        onRetry={retry}
      />
    </View>
  );
}
export function Empty({ title, message }: { title: string; message?: string }) {
  return (
    <View style={s.center}>
      <Ionicons name="list-outline" size={36} color={C.muted} />
      <Text style={[s.title, { textAlign: "center", marginTop: 16 }]}>
        {title}
      </Text>
      {message ? (
        <Text style={[s.hint, { textAlign: "center", marginTop: 8 }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
export function Action({
  title,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  const blocked = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        {
          backgroundColor: secondary ? C.paper : danger ? C.red : C.primary,
          borderColor: secondary ? C.line : "transparent",
          opacity: blocked ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? C.primary : C.white} />
      ) : null}
      <Text
        style={{
          color: secondary ? (danger ? C.red : C.primary) : C.white,
          fontWeight: "600",
          fontSize: 14,
          flexShrink: 1,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  color = C.primary,
  selected = false,
  onPress,
}: {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={{
        minHeight: onPress ? 44 : 26,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? color : C.line,
        backgroundColor: selected ? C.lavender : C.paper,
        justifyContent: "center",
      }}
    >
      <Text
        style={{ color, fontSize: 12, fontWeight: selected ? "600" : "400" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Section({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={{ gap: 12, marginTop: 12 }}>
      <Text style={s.section}>{title}</Text>
      {children}
    </View>
  );
}
const SheetContext = createContext(false);
export function TaskInput({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const inSheet = useContext(SheetContext);
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <Input
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={C.muted}
        selectionColor={C.primary}
        style={[
          s.input,
          props.multiline && { minHeight: 110, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Sheet({
  title,
  onClose,
  busy = false,
  children,
}: React.PropsWithChildren<{
  title: string;
  onClose: () => void;
  busy?: boolean;
}>) {
  const ref = useRef<BottomSheetModal>(null);
  useEffect(() => {
    ref.current?.present();
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!busy) ref.current?.dismiss();
      return true;
    });
    return () => sub.remove();
  }, [busy]);
  return (
    <BottomSheetModal
      ref={ref}
      accessible={false}
      accessibilityRole={null}
      accessibilityLabel={null}
      snapPoints={["85%"]}
      enableDynamicSizing={false}
      onDismiss={onClose}
      enablePanDownToClose={!busy}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: C.canvas }}
      handleIndicatorStyle={{ backgroundColor: C.muted }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={busy ? "none" : "close"}
        />
      )}
    >
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 12,
        }}
      >
        <Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>
          {title}
        </Text>
        <TaskIconButton
          icon="close"
          label="Close"
          onPress={() => ref.current?.dismiss()}
          disabled={busy}
        />
      </View>
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <SheetContext.Provider value>{children}</SheetContext.Provider>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
export type Choice = {
  value: string;
  label: string;
  color?: string;
  description?: string;
};
export function PickField({
  label,
  choices,
  values,
  multiple = false,
  onChange,
  disabled = false,
}: {
  label: string;
  choices: Choice[];
  values: string[];
  multiple?: boolean;
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${
          choices
            .filter((item) => values.includes(item.value))
            .map((item) => item.label)
            .join(", ") || "None"
        }`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[s.pick, { opacity: disabled ? 0.4 : 1 }]}
      >
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.label}>{label}</Text>
          <Text style={{ color: C.primary, fontSize: 14 }}>
            {choices
              .filter((item) => values.includes(item.value))
              .map((item) => item.label)
              .join(", ") || "None"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={C.moss} />
      </Pressable>
      {open ? (
        <ChoiceSheet
          title={label}
          choices={choices}
          initial={values}
          multiple={multiple}
          onClose={() => setOpen(false)}
          onDone={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
export function ChoiceSheet({
  title,
  choices,
  initial = [],
  multiple = false,
  onDone,
  onClose,
}: {
  title: string;
  choices: Choice[];
  initial?: string[];
  multiple?: boolean;
  onDone: (values: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState("");
  return (
    <Sheet title={title} onClose={onClose}>
      {choices.length > 8 ? (
        <TaskInput
          label="Search choices"
          value={search}
          onChangeText={setSearch}
        />
      ) : null}
      {choices
        .filter((choice) =>
          choice.label.toLowerCase().includes(search.toLowerCase()),
        )
        .map((choice) => {
          const checked = selected.includes(choice.value);
          return (
            <Pressable
              key={choice.value}
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityState={{ checked }}
              onPress={() => {
                if (!multiple) {
                  onDone([choice.value]);
                  return;
                }
                setSelected((current) =>
                  checked
                    ? current.filter((value) => value !== choice.value)
                    : [...current, choice.value],
                );
              }}
              style={[
                s.pick,
                { backgroundColor: checked ? C.lavender : C.paper },
              ]}
            >
              {choice.color ? (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: choice.color,
                  }}
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.ink, fontSize: 15 }}>
                  {choice.label}
                </Text>
                {choice.description ? (
                  <Text style={s.hint}>{choice.description}</Text>
                ) : null}
              </View>
              <Ionicons
                name={checked ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={checked ? C.primary : C.muted}
              />
            </Pressable>
          );
        })}
      {multiple ? (
        <Action
          title={`Done${selected.length ? ` · ${selected.length} selected` : ""}`}
          onPress={() => onDone(selected)}
        />
      ) : null}
    </Sheet>
  );
}
export function confirmAction(
  title: string,
  message: string,
  action: () => void,
  destructive = true,
) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: destructive ? "Confirm" : "Continue",
      style: destructive ? "destructive" : "default",
      onPress: action,
    },
  ]);
}
export function showError(error: unknown) {
  Alert.alert(
    "Could not complete that action",
    error instanceof Error ? error.message : "Please try again.",
  );
}
export const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  title: {
    fontFamily: editorialFont,
    fontSize: 25,
    lineHeight: 33,
    color: C.ink,
  },
  hint: { fontSize: 12, lineHeight: 19, color: C.moss },
  label: { fontSize: 12, color: C.moss, fontWeight: "600" },
  section: {
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: C.moss,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    color: C.ink,
    backgroundColor: C.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  pick: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: C.paper,
  },
  action: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  card: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  body: { padding: 22, paddingBottom: 36, gap: 16 },
});
