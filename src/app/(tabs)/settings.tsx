import { ErrorNotice } from "@/components/error-notice";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, type AlertButton } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Button as GluestackButton, ButtonText } from "@/components/ui/button";
import { Redirect, useFocusEffect, useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth";
import {
  getWorkspaceId,
  setWorkspace,
  workspacesApi,
  type Workspace,
} from "@/lib/api";
import {
  C,
  Card,
  Heading,
  Screen,
  SectionTitle,
  StatusBadge,
} from "@/components/ui";

function Row({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <Box className="h-9 w-8 items-center justify-center">
        <Ionicons name={icon} size={20} color={C.moss} />
      </Box>
      <Box className="flex-1">
        <Text className="text-[14px] font-semibold text-typography-950">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-xs leading-[18px] text-typography-600">
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {trailing ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        ) : null)}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[76px] flex-row items-center gap-3 py-3 data-[active=true]:bg-primary-50"
    >
      {content}
    </Pressable>
  ) : (
    <Box className="min-h-[76px] flex-row items-center gap-3 py-3">
      {content}
    </Box>
  );
}
export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState<Workspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const workspaceRequest = React.useRef(0);
  const loadWorkspace = useCallback(async () => {
    const request = ++workspaceRequest.current;
    setWorkspaceError(null);
    try {
      const values = await workspacesApi.list();
      const savedId = await getWorkspaceId();
      if (request !== workspaceRequest.current) return;
      const selected =
        values.find((w) => w.id === savedId) ?? values[0] ?? null;
      if (selected && savedId !== selected.id) await setWorkspace(selected.id);
      if (request !== workspaceRequest.current) return;
      setSpaces(values);
      setActive(selected);
    } catch (error) {
      if (request === workspaceRequest.current)
        setWorkspaceError(
          error instanceof Error ? error.message : "Please try again.",
        );
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void loadWorkspace();
      return () => {
        workspaceRequest.current++;
      };
    }, [loadWorkspace]),
  );
  if (!user) return <Redirect href={"/login" as Href} />;
  const switchSpace = () => {
    if (spaces.length < 2) return;
    const buttons: AlertButton[] = spaces.map((w) => ({
      text: `${w.name}${w.id === active?.id ? "  ✓" : ""}`,
      onPress: async () => {
        try {
          await setWorkspace(w.id);
          setActive(w);
        } catch {
          Alert.alert("Could not switch workspace", "Please try again.");
        }
      },
    }));
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Switch workspace", "Choose a workspace", buttons);
  };
  const confirmSignOut = () =>
    Alert.alert("Sign out of Hoopi?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login" as Href);
        },
      },
    ]);
  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Heading title="Your corner" subtitle="Make yourself at home." />
        <Card className="gap-4 rounded-none border-0 border-b border-outline-200 bg-transparent px-0 pb-6 pt-1">
          <Box className="flex-row items-center gap-4">
            <Box className="h-[68px] w-[68px] items-center justify-center rounded-full border border-primary-200 bg-primary-100">
              <Text className="font-editorial-italic text-[32px] text-primary-500">
                {(user.full_name || user.email).slice(0, 1).toUpperCase()}
              </Text>
            </Box>
            <Box className="flex-1">
              <Text
                numberOfLines={1}
                isTruncated
                className="font-editorial text-[25px] tracking-[-0.5px] text-typography-950"
              >
                {user.full_name || user.email.split("@")[0]}
              </Text>
              <Text
                numberOfLines={1}
                isTruncated
                className="mt-1 text-[13px] text-typography-600"
              >
                {user.email}
              </Text>
            </Box>
          </Box>
          <Box className="flex-row border-t border-outline-100 pt-4">
            <StatusBadge tone="success">Connected to Hoopi</StatusBadge>
          </Box>
        </Card>
        {workspaceError ? (
          <Box className="mt-4">
            <ErrorNotice
              message={workspaceError}
              onRetry={() => {
                void loadWorkspace();
              }}
            />
          </Box>
        ) : null}
        <SectionTitle>Workspace</SectionTitle>
        <Card className="rounded-none border-0 border-b border-outline-200 bg-transparent p-0">
          <Row
            icon="business-outline"
            title={
              active?.name ??
              (workspaceError ? "Workspace unavailable" : "Loading workspace…")
            }
            subtitle={
              spaces.length > 1
                ? "Tap to switch workspace"
                : active?.is_personal
                  ? "Personal workspace"
                  : "Your Hoopi workspace"
            }
            onPress={spaces.length > 1 ? switchSpace : undefined}
            trailing={
              spaces.length > 1 ? (
                <Ionicons name="chevron-down" size={17} color={C.moss} />
              ) : undefined
            }
          />
        </Card>
        <SectionTitle>In your workspace</SectionTitle>
        <Card className="rounded-none border-0 border-b border-outline-200 bg-transparent p-0">
          <Row
            icon="book-outline"
            title="Knowledge"
            subtitle="Context for more useful answers"
            onPress={() => router.push("/(tabs)/knowledge" as Href)}
          />
          <Box className="ml-[44px] h-px bg-outline-100" />
          <Row
            icon="folder-outline"
            title="Files"
            subtitle="Your uploads and finished work"
            onPress={() => router.push("/(tabs)/files" as Href)}
          />
          <Box className="ml-[44px] h-px bg-outline-100" />
          <Row
            icon="chatbubbles-outline"
            title="Conversations"
            subtitle="Pick up a recent conversation"
            onPress={() => router.push("/(tabs)/chat/history" as Href)}
          />
        </Card>
        <SectionTitle>About</SectionTitle>
        <Card className="rounded-none border-0 border-b border-outline-200 bg-transparent p-0">
          <Row
            icon="shield-checkmark-outline"
            title="Privacy & security"
            subtitle="Secure connection to your workspace"
          />
          <Box className="ml-[44px] h-px bg-outline-100" />
          <Row
            icon="information-circle-outline"
            title="Hoopi for mobile"
            subtitle="Your workspace, wherever you are"
            trailing={<Text className="text-xs text-typography-600">v1.0</Text>}
          />
        </Card>
        <GluestackButton
          action="negative"
          variant="outline"
          onPress={confirmSignOut}
          className="mt-7 h-[52px] gap-2 rounded-full border-outline-200 bg-transparent data-[active=true]:bg-background-error"
        >
          <Ionicons name="log-out-outline" size={19} color={C.red} />
          <ButtonText style={{ color: C.red }}>Sign out</ButtonText>
        </GluestackButton>
      </ScrollView>
    </Screen>
  );
}
