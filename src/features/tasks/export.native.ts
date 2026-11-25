import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { randomUUID } from "expo-crypto";
import { tasksToCsv } from "./bulk";
import type { TaskBoardDetail, TaskSummary } from "./types";

export async function shareTasksCsv(
  board: TaskBoardDetail,
  tasks: TaskSummary[],
) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is not available on this device.");
  const file = new File(Paths.cache, `tasks-${board.id}-${randomUUID()}.csv`);
  file.create();
  await file.write(`\uFEFF${tasksToCsv(board, tasks)}`);
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
    dialogTitle: "Export selected tasks",
  });
}
