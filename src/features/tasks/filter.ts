/** Shared search and filters for all native board views. */

import type { TaskPriority, TaskSummary } from "./types";

export type PriorityFilter = "all" | TaskPriority;
/** Any workspace member, or all / unassigned. */
export type AssigneeFilter = "all" | "unassigned" | number;

/** A status column's id, or every column. */
export type StatusFilter = "all" | number;

export function matches(
  task: TaskSummary,
  search: string,
  priority: PriorityFilter,
  assignee: AssigneeFilter,
  status: StatusFilter = "all",
): boolean {
  // A task matches a person when that person is any of its assignees.
  const people =
    task.assignees ??
    (task.assignee_user_id != null
      ? [{ user_id: task.assignee_user_id, name: task.assignee_name }]
      : []);
  if (priority !== "all" && task.priority !== priority) return false;
  if (status !== "all" && task.column_id !== status) return false;
  // Retired or unknown assignee filters must not silently match everyone.
  if (typeof assignee === "string" && !["all", "unassigned"].includes(assignee))
    return false;
  if (
    assignee === "unassigned" &&
    (people.length > 0 || (task.skills?.length ?? 0) > 0)
  )
    return false;
  if (
    typeof assignee === "number" &&
    !people.some((person) => person.user_id === assignee)
  )
    return false;
  if (search) {
    const names = people.map((person) => person.name ?? "").join("\n");
    const haystack =
      `${task.title}\n${task.description}\n${task.labels.join("\n")}\n${names}`.toLowerCase();
    if (!search.split(/\s+/).every((word) => haystack.includes(word)))
      return false;
  }
  return true;
}
