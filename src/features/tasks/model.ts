import type { TaskAttention, TaskBoardDetail, TaskSummary } from "./types";

export const defaultPriorities = [
  { key: "low", name: "Low", color: "#6b7280" },
  { key: "medium", name: "Medium", color: "#3b82f6" },
  { key: "high", name: "High", color: "#f59e0b" },
  { key: "urgent", name: "Urgent", color: "#ef4444" },
];
/** Keep idle boards quiet; agent results continue updating while work is active. */
export function hasActiveAgents(task: Pick<TaskSummary, "skills"> | undefined) {
  return !!task?.skills?.some(
    (skill) =>
      skill.last_run &&
      [
        "pending",
        "queued",
        "running",
        "awaiting_approval",
        "waiting_input",
      ].includes(skill.last_run.status),
  );
}
export function numericId(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value;
  if (!text || !/^[1-9]\d*$/.test(text)) return null;
  const result = Number(text);
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}
export function dayKey(value: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dueOnDay(day: string) {
  const date = new Date(`${day}T12:00:00`);
  if (dayKey(date) !== day) throw new Error("Choose a valid date.");
  return date.toISOString();
}
export function dateLabel(value: string | null) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No due date";
}
export function overdue(task: TaskSummary, today = new Date()) {
  const due = dayKey(task.due_at);
  return !task.completed_at && !!due && due < dayKey(today);
}
export function topLevel(tasks: TaskSummary[]) {
  return tasks.filter((task) => task.parent_task_id == null);
}
export function boardStats(board: TaskBoardDetail, now = new Date()) {
  const tasks = topLevel(board.tasks).filter((task) => !task.is_archived);
  const done = tasks.filter((task) => !!task.completed_at).length;
  return {
    total: tasks.length,
    done,
    open: tasks.length - done,
    overdue: tasks.filter((task) => overdue(task, now)).length,
    progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}
export function duplicatePayload(task: TaskSummary) {
  return {
    board_id: task.board_id,
    column_id: task.column_id,
    ...(task.parent_task_id != null
      ? { parent_task_id: task.parent_task_id }
      : task.group_id != null
        ? { group_id: task.group_id }
        : {}),
    title: `${task.title} (copy)`.slice(0, 200),
    description: task.description,
    priority: task.priority,
    due_at: task.due_at,
    labels: task.labels,
    assignee_user_ids: (task.assignees ?? []).map((person) => person.user_id),
    custom_values: task.custom_values ?? {},
  };
}
export function attentionItems(attention?: TaskAttention, boardId?: number) {
  const rows = new Map<
    number,
    {
      taskId: number;
      boardId: number;
      title: string;
      input: number;
      approval: number;
      review: number;
    }
  >();
  const get = (id: number, board: number, title: string) => {
    if (boardId !== undefined && board !== boardId) return;
    if (!rows.has(id))
      rows.set(id, {
        taskId: id,
        boardId: board,
        title,
        input: 0,
        approval: 0,
        review: 0,
      });
    return rows.get(id)!;
  };
  for (const q of attention?.questions ?? []) {
    if (q.task_id == null || q.board_id == null) continue;
    const row = get(q.task_id, q.board_id, q.task_title ?? "Task");
    if (row) row[q.kind === "approval" ? "approval" : "input"]++;
  }
  for (const a of attention?.approvals ?? []) {
    const row = get(a.task_id, a.board_id, a.task_title);
    if (row) row.approval++;
  }
  for (const a of attention?.reviews ?? []) {
    const row = get(a.task_id, a.board_id, a.task_title);
    if (row) row.review++;
  }
  return [...rows.values()].sort(
    (a, b) =>
      Number(!a.input) - Number(!b.input) ||
      Number(!a.approval) - Number(!b.approval) ||
      a.taskId - b.taskId,
  );
}
/** Parse the whole accumulated response: links can be split across SSE chunks. */
export function plannedBoardId(value: unknown): number | null {
  if (
    value &&
    typeof value === "object" &&
    Number.isSafeInteger((value as { board_id?: number }).board_id) &&
    (value as { board_id: number }).board_id > 0
  )
    return (value as { board_id: number }).board_id;
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  const match = /(?:board_id["'\s:=]+|(?:dashboard\/)?tasks\/)(\d+)/i.exec(
    text,
  );
  return match ? numericId(match[1]) : null;
}
