import { tasksToCsv } from "./bulk";
import type { TaskBoardDetail, TaskSummary } from "./types";

export async function shareTasksCsv(
  board: TaskBoardDetail,
  tasks: TaskSummary[],
) {
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${tasksToCsv(board, tasks)}`], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `tasks-${board.id}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
