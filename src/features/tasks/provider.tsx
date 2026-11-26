import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  useFocusEffect,
  useRouter,
  useIsFocused,
  type Href,
} from "expo-router";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  ApiError,
  getWorkspaceId,
  setWorkspace,
  workspacesApi,
  type Workspace,
} from "@/lib/api";
import { taskClient, type TaskClient } from "./api";
import { taskKey } from "./query-keys";
export { taskKey } from "./query-keys";

const Context = createContext<{
  workspace: Workspace | null;
  spaces: Workspace[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  switchWorkspace: (id: number) => Promise<void>;
  foreground: boolean;
} | null>(null);

export function TasksProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            retry: (count, error) =>
              count < 2 &&
              (!(error instanceof ApiError) || error.status >= 500),
          },
          mutations: { retry: false },
        },
      }),
  );
  const [workspace, select] = useState<Workspace | null>(null);
  const [spaces, setSpaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const selected = useRef<number | null>(null);
  const version = useRef(0);
  const refresh = useCallback(() => {
    const run = ++version.current;
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const [values, stored] = await Promise.all([
          workspacesApi.list(),
          getWorkspaceId(),
        ]);
        if (run !== version.current) return;
        const next =
          values.find((space) => space.id === stored) ?? values[0] ?? null;
        if (next && next.id !== stored) await setWorkspace(next.id);
        if (run !== version.current) return;
        if (selected.current !== null && selected.current !== next?.id) {
          await client.cancelQueries({ queryKey: ["mobile-tasks"] });
          router.dismissTo("/(tabs)/tasks" as Href);
        }
        selected.current = next?.id ?? null;
        select(next);
        setSpaces(values);
      } catch (cause) {
        if (run === version.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load your workspaces.",
          );
      } finally {
        if (run === version.current) setLoading(false);
      }
    })();
  }, [client, router]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        version.current++;
      };
    }, [refresh]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  const switchWorkspace = useCallback(
    async (id: number) => {
      if (id === selected.current) return;
      const next = spaces.find((space) => space.id === id);
      if (!next) return;
      version.current++;
      await client.cancelQueries({ queryKey: ["mobile-tasks"] });
      await setWorkspace(id);
      selected.current = id;
      select(next);
      setLoading(false);
      setError(null);
      router.dismissTo("/(tabs)/tasks" as Href);
    },
    [client, spaces, router],
  );
  const value = useMemo(
    () => ({
      workspace,
      spaces,
      loading,
      error,
      refresh,
      switchWorkspace,
      foreground,
    }),
    [workspace, spaces, loading, error, refresh, switchWorkspace, foreground],
  );
  return (
    <QueryClientProvider client={client}>
      <Context.Provider value={value}>
        <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
      </Context.Provider>
    </QueryClientProvider>
  );
}

export function useOptionalTaskWorkspace() {
  return useContext(Context);
}

export function useTaskWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("TasksProvider is required.");
  return value;
}

export function useTaskQuery<T>(
  key: QueryKey,
  query: (client: TaskClient) => Promise<T>,
  poll: boolean | ((data: T | undefined) => boolean) = false,
  enabled = true,
) {
  const { workspace, foreground, loading } = useTaskWorkspace();
  const focused = useIsFocused();
  const id = workspace?.id ?? null;
  return useQuery({
    queryKey: taskKey(id, ...key),
    queryFn: ({ signal }) => query(taskClient(id!, signal)),
    enabled: id !== null && !loading && foreground && focused && enabled,
    refetchOnMount: "always",
    refetchInterval: (result) => {
      const error = result.state.error;
      if (error instanceof ApiError && [401, 403, 404].includes(error.status))
        return false;
      return foreground &&
        focused &&
        (typeof poll === "function" ? poll(result.state.data) : poll)
        ? 3000
        : false;
    },
  });
}

export function useTaskAction() {
  const { workspace } = useTaskWorkspace();
  const queryClient = useQueryClient();
  const current = useRef(workspace?.id);
  useEffect(() => {
    current.current = workspace?.id;
    return () => {
      current.current = undefined;
    };
  }, [workspace?.id]);
  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number;
      action: (client: TaskClient) => Promise<unknown>;
    }) => action(taskClient(id)),
    onSettled: (_data, _error, variables) =>
      queryClient.invalidateQueries({ queryKey: taskKey(variables.id) }),
  });
  async function run<T>(
    action: (client: TaskClient) => Promise<T>,
  ): Promise<T> {
    if (!workspace) throw new Error("Choose a workspace first.");
    if (inFlight.current)
      throw new Error("A change is already being saved. Please wait.");
    inFlight.current = true;
    const id = workspace.id;
    try {
      const result = await mutation.mutateAsync({ id, action });
      if (current.current !== id)
        throw new Error(
          "Your workspace changed. Return to Tasks to see the result.",
        );
      return result as T;
    } finally {
      inFlight.current = false;
    }
  }
  return { run, busy: mutation.isPending, error: mutation.error };
}
