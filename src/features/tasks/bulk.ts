/** Bulk mutations and CSV formatting, adapted from the web Tasks module. */

import type { TaskBoardDetail, TaskSummary } from "./types";
import { dayKey } from "./model";

/** The most tasks one bulk action may change. */
export const MAX_BULK = 200;

export type BulkResult = { ok: number[]; failed: number[] };

/**
 * Run `fn` for every id, at most `limit` at a time, and report which ids
 * succeeded and which failed. It never throws.
 */
export async function runBulk(
  ids: number[],
  fn: (id: number) => Promise<unknown>,
  limit = 4,
): Promise<BulkResult> {
  const ok: number[] = [];
  const failed: number[] = [];
  let next = 0;
  async function worker() {
    while (next < ids.length) {
      const id = ids[next];
      next += 1;
      try {
        await fn(id);
        ok.push(id);
      } catch {
        failed.push(id);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, ids.length) }, worker),
  );
  // Report in the order given, not the order the calls finished.
  return {
    ok: ids.filter((id) => ok.includes(id)),
    failed: ids.filter((id) => failed.includes(id)),
  };
}

/** "Archived 5 tasks", or "Archived 3 of 5 tasks. 2 could not be changed." */
export function bulkMessage(verb: string, result: BulkResult): string {
  const total = result.ok.length + result.failed.length;
  const noun = total === 1 ? "task" : "tasks";
  if (result.failed.length === 0) return `${verb} ${total} ${noun}`;
  return `${verb} ${result.ok.length} of ${total} ${noun}. ${result.failed.length} could not be changed.`;
}

/**
 * One CSV cell. Quotes when needed, and puts a `'` before a value a
 * spreadsheet would run as a formula (=, +, -, @, tab, carriage return).
 */
export function csvCell(value: string): string {
  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** The ticked rows as CSV: the fixed columns, then each custom column. */
export function tasksToCsv(
  board: TaskBoardDetail,
  tasks: TaskSummary[],
): string {
  const columns = new Map(
    board.columns.map((column) => [column.id, column.name]),
  );
  const groups = new Map(
    (board.groups ?? []).map((group) => [group.id, group.name]),
  );
  const firstGroup = [...(board.groups ?? [])].sort(
    (a, b) => a.position - b.position,
  )[0];
  const priorities = new Map(
    (board.priority_labels ?? []).map((p) => [p.key, p.name]),
  );
  const fields = [...(board.fields ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const header = [
    "Task",
    "Group",
    "Status",
    "Priority",
    "Assignees",
    "Due date",
    ...fields.map((f) => f.name),
  ];
  const rows = tasks.map((task) => {
    const group =
      task.group_id != null ? groups.get(task.group_id) : firstGroup?.name;
    const people = (task.assignees ?? [])
      .map((a) => a.name ?? "")
      .filter(Boolean)
      .join("; ");
    const due = dayKey(task.due_at);
    const custom = fields.map((field) => {
      const value = task.custom_values?.[String(field.id)];
      if (value == null) return "";
      if (field.type === "label")
        return field.options.find((o) => o.id === value)?.name ?? "";
      if (Array.isArray(value))
        return value
          .map((person) =>
            person.kind === "user"
              ? (task.assignees.find(
                  (assignee) => assignee.user_id === person.id,
                )?.name ?? `Member #${person.id}`)
              : (task.skills?.find((skill) => skill.skill_id === person.id)
                  ?.name ?? `Agent #${person.id}`),
          )
          .join("; ");
      return String(value);
    });
    return [
      task.title,
      group ?? "",
      columns.get(task.column_id) ?? "",
      priorities.get(task.priority) ?? task.priority,
      people,
      due,
      ...custom,
    ];
  });
  return (
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
