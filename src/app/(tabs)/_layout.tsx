import { Redirect, Tabs, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { Box } from "@/components/ui/box";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/components/ui";
import { useAuth } from "@/context/auth";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  chat: "chatbubble-ellipses-outline",
  work: "checkmark-done-outline",
  knowledge: "book-outline",
  files: "folder-outline",
  settings: "person-circle-outline",
};

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <Box className="h-8 w-[48px] items-center justify-center">
      <Ionicons name={name} color={focused ? C.primary : C.muted} size={21} />
    </Box>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.canvas,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={C.primary} />
      </View>
    );
  if (!user) return <Redirect href={"/login" as Href} />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        // Keep its layout space stable; the native keyboard covers the tab bar.
        // The composer moves with keyboard progress instead of a second tab animation.
        tabBarHideOnKeyboard: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.moss,
        tabBarStyle: {
          backgroundColor: C.canvas,
          borderTopColor: C.line,
          height: 64 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarIconStyle: { marginBottom: 3 },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 16,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={icons[route.name] ?? "ellipse-outline"}
            focused={focused}
          />
        ),
      })}
    >
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="work" options={{ title: "Work" }} />
      <Tabs.Screen name="knowledge" options={{ title: "Knowledge" }} />
      <Tabs.Screen name="files" options={{ title: "Files" }} />
      <Tabs.Screen name="settings" options={{ title: "You" }} />
    </Tabs>
  );
}
