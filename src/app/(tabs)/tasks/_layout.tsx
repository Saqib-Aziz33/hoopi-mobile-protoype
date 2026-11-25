import { Stack } from "expo-router";
import { C } from "@/components/ui";
import { TasksProvider } from "@/features/tasks/provider";

export const unstable_settings = { anchor: "index" };
export default function TasksLayout() {
  return (
    <TasksProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.canvas },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="board/[boardId]" />
        <Stack.Screen name="task/[taskId]" />
        <Stack.Screen name="activity" />
      </Stack>
    </TasksProvider>
  );
}
