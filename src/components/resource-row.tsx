import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Skeleton } from "@/components/ui/skeleton";
import { C } from "@/components/ui";

export function ResourceRow({
  title,
  subtitle,
  icon,
  generated = false,
  status,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  generated?: boolean;
  status?: "ready" | "pending" | "failed";
  onPress?: () => void;
}) {
  const extension = title.includes(".")
    ? title.split(".").pop()?.slice(0, 5).toUpperCase()
    : "FILE";
  const tint =
    extension === "PDF"
      ? C.peach
      : extension === "DOCX"
        ? C.lavender
        : extension === "XLSX"
          ? C.sage
          : "#EDE5D7";
  const content = (
    <>
      <Box
        className="h-[49px] w-[38px] items-center justify-center rounded-[5px] rounded-tr-[12px]"
        style={{ backgroundColor: tint }}
      >
        <Ionicons
          name={icon}
          size={17}
          color={generated ? C.primary : C.coral}
        />
        <Text
          className="mt-1 text-[7px] font-medium tracking-[0.8px]"
          style={{ color: C.ink }}
        >
          {extension}
        </Text>
      </Box>
      <Box className="flex-1">
        <Text
          numberOfLines={2}
          className="text-[13px] font-medium leading-5 text-typography-950"
        >
          {title}
        </Text>
        <Box className="mt-1.5 flex-row items-center gap-1.5">
          {status ? (
            <Box
              className="h-1 w-1 rounded-full"
              style={{
                backgroundColor:
                  status === "ready"
                    ? C.green
                    : status === "failed"
                      ? C.red
                      : C.amber,
              }}
            />
          ) : null}
          <Text
            className="text-[11px] leading-[18px]"
            style={{ color: status === "failed" ? C.red : C.moss }}
          >
            {subtitle}
          </Text>
        </Box>
      </Box>
      {onPress ? (
        <Ionicons name="arrow-down-outline" size={17} color={C.moss} />
      ) : status === "ready" ? (
        <Ionicons name="checkmark" size={16} color={C.green} />
      ) : null}
    </>
  );
  const className =
    "min-h-[88px] flex-row items-center gap-4 border-b border-outline-200 py-4";
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      onPress={onPress}
      className={`${className} data-[active=true]:opacity-60`}
    >
      {content}
    </Pressable>
  ) : (
    <Box className={className}>{content}</Box>
  );
}

export function ListLoading() {
  return (
    <Box accessibilityLabel="Loading items" accessibilityState={{ busy: true }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          className="min-h-[88px] flex-row items-center gap-4 border-b border-outline-200 py-4"
        >
          <Skeleton className="h-12 w-[38px] rounded-md" />
          <Box className="flex-1 gap-3">
            <Skeleton className="h-2.5 w-4/5 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
