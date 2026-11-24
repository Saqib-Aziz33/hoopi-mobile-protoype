import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";
import { C, Field } from "@/components/ui";

export function LibrarySearch({
  value,
  onChange,
  placeholder = "Search documents",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Box className="mt-5 min-h-[48px] flex-row items-center rounded-full bg-[#F0EBE3] pl-4">
      <Ionicons name="search-outline" size={17} color={C.moss} />
      <Box className="flex-1">
        <Field
          plain
          accessibilityLabel={placeholder}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={{ fontSize: 13 }}
        />
      </Box>
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChange("")}
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons name="close" size={17} color={C.moss} />
        </Pressable>
      ) : null}
    </Box>
  );
}
