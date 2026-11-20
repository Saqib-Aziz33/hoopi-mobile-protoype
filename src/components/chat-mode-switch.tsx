import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/components/ui";

export function ChatModeSwitch({
  value,
  onChange,
}: {
  value: "chat" | "work";
  onChange: (value: "chat" | "work") => void;
  tabWidth?: number;
}) {
  return (
    <Box className="flex-row gap-2 pb-3 pt-4">
      {(["chat", "work"] as const).map((mode) => (
        <Pressable
          key={mode}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === mode }}
          onPress={() => onChange(mode)}
          className={`min-h-11 flex-row items-center gap-2 rounded-full border px-4 py-2 ${value === mode ? "border-primary-500 bg-primary-500" : "border-outline-200 bg-transparent"}`}
        >
          <Ionicons
            name={mode === "chat" ? "chatbubble-outline" : "sparkles-outline"}
            size={14}
            color={value === mode ? C.paper : C.moss}
          />
          <Text
            className={`text-xs ${value === mode ? "text-white" : "text-typography-600"}`}
          >
            {mode === "chat" ? "Conversation" : "Work with me"}
          </Text>
        </Pressable>
      ))}
    </Box>
  );
}
