import { ActivityIndicator, Alert, Linking } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Box as View } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/components/ui";
import type { DictationError, DictationStatus } from "@/lib/dictation";

export function VoiceInputButton({
  status,
  disabled,
  onPress,
}: {
  status: DictationStatus;
  disabled: boolean;
  onPress: () => void;
}) {
  const active = status !== "idle";
  const waiting = status === "requesting" || status === "finishing";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        waiting
          ? "Cancel voice input"
          : active
            ? "Stop voice input"
            : "Start voice input"
      }
      accessibilityState={{ disabled: disabled && !active, selected: active }}
      disabled={disabled && !active}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 9,
        backgroundColor: active || pressed ? C.lavender : "transparent",
        opacity: disabled && !active ? 0.4 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      {waiting ? (
        <ActivityIndicator color={C.primary} size="small" />
      ) : (
        <Ionicons
          name={active ? "stop" : "mic-outline"}
          size={21}
          color={active ? C.primary : C.moss}
        />
      )}
    </Pressable>
  );
}

export function VoiceInputStatus({
  status,
  error,
  onCancel,
  onDismiss,
}: {
  status: DictationStatus;
  error: DictationError | null;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const text =
    status === "requesting"
      ? "Preparing voice input…"
      : status === "listening"
        ? "Listening… stop when you’re done."
        : status === "finishing"
          ? "Finishing voice input…"
          : error?.message;
  if (!text) return null;
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
      <Text
        accessibilityLiveRegion="polite"
        style={{
          color: error ? C.red : C.primary,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {text}
      </Text>
      <View style={{ flexDirection: "row", gap: 16 }}>
        {status !== "idle" ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: C.moss, fontSize: 12 }}>
              Cancel voice input
            </Text>
          </Pressable>
        ) : null}
        {error?.settings ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Linking.openSettings().catch(() =>
                Alert.alert(
                  "Could not open settings",
                  "Open your device settings to allow microphone and speech recognition access.",
                ),
              );
            }}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: C.primary, fontSize: 12, fontWeight: "600" }}>
              Open settings
            </Text>
          </Pressable>
        ) : null}
        {error ? (
          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: C.moss, fontSize: 12 }}>Dismiss</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
