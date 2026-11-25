import type { QueryKey } from "@tanstack/react-query";

export const taskKey = (workspace: number | null, ...parts: QueryKey) =>
  ["mobile-tasks", workspace, ...parts] as const;
