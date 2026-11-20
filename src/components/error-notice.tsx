import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { C, Button } from "@/components/ui";

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Box
      accessibilityRole="alert"
      className="mb-3 gap-2 rounded-2xl border border-error-100 bg-background-error p-4"
    >
      <Box className="flex-row items-center gap-2">
        <Ionicons name="cloud-offline-outline" size={19} color={C.red} />
        <Text className="text-sm font-semibold text-typography-950">
          Couldn’t load this just yet
        </Text>
      </Box>
      <Text className="text-[13px] leading-5 text-typography-600">
        {message}
      </Text>
      <Button
        secondary
        title="Try again"
        icon="refresh-outline"
        onPress={onRetry}
        style={{ alignSelf: "flex-start", marginTop: 4, minHeight: 44 }}
      />
    </Box>
  );
}
