/** Immutable card ordering for optimistic moves; covered in scripts/tasks.test.cjs. */

import type { TaskSummary } from "./types";

/** The tasks of one column, in position order. */
export function tasksInColumn<
  T extends Pick<TaskSummary, "column_id" | "position">,
>(tasks: readonly T[], columnId: number): T[] {
  return tasks
    .filter((task) => task.column_id === columnId)
    .sort((a, b) => a.position - b.position);
}

/**
 * Moves one task to `toColumnId` at `toIndex` and returns a new array.
 * Positions in the source and the target column are renumbered from 0, the
 * same way the API does it. An index past the end lands at the end. Tasks in
 * other columns are untouched. An unknown task id returns the input unchanged.
 */
export function moveTask<
  T extends Pick<TaskSummary, "id" | "column_id" | "position">,
>(
  tasks: readonly T[],
  taskId: number,
  toColumnId: number,
  toIndex: number,
): T[] {
  const moving = tasks.find((task) => task.id === taskId);
  if (!moving) return [...tasks];

  const fromColumnId = moving.column_id;
  const source = tasksInColumn(tasks, fromColumnId).filter(
    (task) => task.id !== taskId,
  );
  const target =
    fromColumnId === toColumnId ? source : tasksInColumn(tasks, toColumnId);

  const index = Math.max(0, Math.min(toIndex, target.length));
  const moved = { ...moving, column_id: toColumnId };
  const nextTarget = [...target.slice(0, index), moved, ...target.slice(index)];

  const renumbered = new Map<number, T>();
  nextTarget.forEach((task, position) =>
    renumbered.set(task.id, { ...task, position }),
  );
  if (fromColumnId !== toColumnId) {
    source.forEach((task, position) =>
      renumbered.set(task.id, { ...task, position }),
    );
  }

  return tasks.map((task) => renumbered.get(task.id) ?? task);
}

/** Moves the id to `toIndex` in a flat list of column ids. */
export function reorderIds(
  ids: readonly number[],
  id: number,
  toIndex: number,
): number[] {
  if (!ids.includes(id)) return [...ids];
  const rest = ids.filter((item) => item !== id);
  const index = Math.max(0, Math.min(toIndex, rest.length));
  return [...rest.slice(0, index), id, ...rest.slice(index)];
}
