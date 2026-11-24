import { Ionicons } from "@expo/vector-icons";
import type { Conversation } from "@/lib/api";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { C } from "@/components/ui";

export function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const raw = conversation.updated_at ?? conversation.created_at;
  const date = raw ? new Date(raw) : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[90px] flex-row items-center gap-4 border-b border-outline-200 py-4 data-[active=true]:opacity-60"
    >
      <Box className="h-10 w-10 items-center justify-center rounded-full bg-primary-100">
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={21}
          color={C.primary}
        />
      </Box>
      <Box className="flex-1">
        <Text
          numberOfLines={2}
          className="font-editorial text-[17px] leading-6 text-typography-950"
        >
          {conversation.title || "New conversation"}
        </Text>
        <Text className="mt-1.5 text-xs text-typography-600">
          {date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : "Conversation"}
        </Text>
      </Box>
      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </Pressable>
  );
}
