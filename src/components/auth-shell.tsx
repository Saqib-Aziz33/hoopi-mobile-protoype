import type { PropsWithChildren } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { EditorialBloom } from "@/components/editorial-bloom";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { C, Screen } from "@/components/ui";

export function AuthShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { height } = useWindowDimensions();
  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        automaticOffset
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 26,
          }}
        >
          <Box className="flex-row items-center justify-between border-b border-outline-200 pb-4">
            <Text className="font-editorial-italic text-[36px] tracking-[-1.5px] text-primary-500">
              hoopi
            </Text>
            <Text className="text-[9px] uppercase tracking-[2.2px] text-typography-600">
              A little more possible
            </Text>
          </Box>
          <Box
            className="w-full max-w-[420px] flex-1 self-center justify-center"
            style={{ paddingTop: height < 740 ? 24 : 46, paddingBottom: 30 }}
          >
            <Box className="relative mb-8">
              <Box className="absolute -right-4 top-0">
                <EditorialBloom size={112} />
              </Box>
              <Text
                accessibilityRole="header"
                className="font-editorial text-[43px] leading-[51px] tracking-[-1.5px] text-typography-950"
                style={{ maxWidth: 265 }}
              >
                {title}
              </Text>
              <Text className="mt-4 max-w-[295px] text-[13px] leading-[21px] text-typography-600">
                {subtitle}
              </Text>
            </Box>
            <Box className="gap-5">{children}</Box>
          </Box>
          <Box className="flex-row items-center justify-center gap-2 border-t border-outline-200 pt-5">
            <Ionicons name="lock-closed-outline" size={12} color={C.moss} />
            <Text className="text-[11px] text-typography-600">
              A private space for your thoughts and work.
            </Text>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
