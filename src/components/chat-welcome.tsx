import { useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { EditorialBloom } from "@/components/editorial-bloom";
import { C } from "@/components/ui";

const prompts = {
  chat: [
    {
      icon: "bulb-outline",
      title: "Think it\nthrough",
      prompt: "Help me think through an idea",
      color: C.lavender,
    },
    {
      icon: "create-outline",
      title: "Find the\nright words",
      prompt: "Draft a message for me",
      color: C.peach,
    },
  ],
  work: [
    {
      icon: "calendar-outline",
      title: "Plan a\nbetter week",
      prompt: "Help me plan this week",
      color: C.sage,
    },
    {
      icon: "search-outline",
      title: "Do the\ngroundwork",
      prompt: "Research a topic and write a brief",
      color: C.peach,
    },
  ],
} as const;

export function ChatWelcome({
  work,
  onSelect,
}: {
  work: boolean;
  onSelect: (prompt: string) => void;
}) {
  const { user } = useAuth();
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const name = user?.full_name?.trim().split(/\s+/)[0];
  return (
    <Box
      className="flex-1 justify-center"
      style={{ paddingVertical: compact ? 8 : 26 }}
    >
      <Box className="relative">
        <Text
          className="text-[13px] text-typography-600"
          style={{ marginBottom: compact ? 10 : 16 }}
        >
          {name ? `Hello, ${name}.` : "A moment for yourself."}
        </Text>
        <Box
          pointerEvents="none"
          className="absolute -right-2 top-4"
          style={{ opacity: 0.95 }}
        >
          <EditorialBloom size={compact ? 82 : 108} />
        </Box>
        <Text
          accessibilityRole="header"
          className="font-editorial tracking-[-1.3px] text-typography-950"
          style={{ fontSize: compact ? 30 : 39, lineHeight: compact ? 35 : 47 }}
        >
          {work ? "Good work.\n" : "A little room\n"}
          <Text
            className="font-editorial-italic text-primary-500"
            style={{
              fontSize: compact ? 30 : 39,
              lineHeight: compact ? 35 : 47,
            }}
          >
            {work ? "Less effort." : "to think."}
          </Text>
        </Text>
        {!compact ? (
          <Text className="mt-4 max-w-[270px] text-[13px] leading-[21px] text-typography-600">
            {work
              ? "The research, the planning, the first draft.\nYou don’t have to do it all."
              : "For the half-formed ideas, the questions,\nand everything you’re figuring out."}
          </Text>
        ) : null}
      </Box>
      <Box
        className="flex-row items-center gap-3"
        style={{ marginTop: compact ? 16 : 28 }}
      >
        <Box className="h-px w-5 bg-primary-300" />
        <Text className="text-[9px] uppercase tracking-[2px] text-typography-600">
          {work ? "Leave it with Hoopi" : "Start with a thought"}
        </Text>
      </Box>
      <Box className="mt-3 flex-row gap-3">
        {prompts[work ? "work" : "chat"].map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            accessibilityLabel={item.title.replace("\n", " ")}
            onPress={() => onSelect(item.prompt)}
            className="flex-1 rounded-[14px] data-[active=true]:opacity-75"
            style={{
              backgroundColor: item.color,
              minHeight: compact ? 94 : 134,
              padding: compact ? 12 : 16,
            }}
          >
            <Box
              className="flex-row items-center justify-between"
              style={{ marginBottom: compact ? 8 : 12 }}
            >
              <Ionicons name={item.icon} size={19} color={C.primary} />
              <Ionicons
                name="arrow-up-outline"
                size={15}
                color={C.primary}
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </Box>
            <Text
              className="font-editorial tracking-[-0.3px] text-typography-950"
              style={{
                fontSize: compact ? 18 : 21,
                lineHeight: compact ? 23 : 27,
              }}
            >
              {item.title}
            </Text>
          </Pressable>
        ))}
      </Box>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={work ? "Create a document" : "Summarize my updates"}
        onPress={() =>
          onSelect(
            work
              ? "Turn my notes into a document"
              : "Summarize my latest updates",
          )
        }
        className="mt-2 min-h-11 flex-row items-center justify-between border-b border-outline-200 py-3"
      >
        <Text className="text-xs text-typography-600">
          {work
            ? "Or, turn your notes into a document"
            : "Or, catch up on your latest updates"}
        </Text>
        <Ionicons name="arrow-forward" size={15} color={C.moss} />
      </Pressable>
    </Box>
  );
}
