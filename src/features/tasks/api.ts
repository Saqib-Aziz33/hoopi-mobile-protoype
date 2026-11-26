import { api } from "@/lib/api";
import type {
  TaskAttention,
  TaskBoardCreatePayload,
  TaskBoardDetail,
  TaskBoardFromTemplatePayload,
  TaskBoardSummary,
  TaskBoardTemplate,
  TaskBoardTemplateCreatePayload,
  TaskBoardTemplateDetail,
  TaskBoardTemplateSavePayload,
  TaskBoardTemplateUpdatePayload,
  TaskBoardUpdatePayload,
  TaskColumnCreatePayload,
  TaskColumnUpdatePayload,
  TaskCreatePayload,
  TaskDetail,
  TaskFieldCreatePayload,
  TaskFieldUpdatePayload,
  TaskGroupCreatePayload,
  TaskGroupUpdatePayload,
  TaskListFilters,
  TaskMovePayload,
  TaskSummary,
  TaskSkillRun,
  TaskUpdatePayload,
  PendingQuestionRecord,
  WorkspaceMember,
  SkillChoice,
} from "./types";

function query(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function taskClient(workspaceId: number, signal?: AbortSignal) {
  const apiRequest = <T>({
    method,
    url,
    data,
  }: {
    method: string;
    url: string;
    data?: unknown;
  }) =>
    api<T>(
      url,
      {
        method,
        signal,
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      },
      workspaceId,
    );
  const taskBoardsApi = {
    async list(includeArchived = false): Promise<TaskBoardSummary[]> {
      return apiRequest<TaskBoardSummary[]>({
        method: "GET",
        url: `/task-boards${query({ include_archived: includeArchived || undefined })}`,
      });
    },

    async get(boardId: number): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "GET",
        url: `/task-boards/${boardId}`,
      });
    },

    async create(payload: TaskBoardCreatePayload): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "POST",
        url: "/task-boards",
        data: payload,
      });
    },

    /** The sample board for a workspace with no board. 409 once it has one. */
    async createStarter(): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "POST",
        url: "/task-boards/starter",
      });
    },

    // Board template selection.

    /** The built-in templates, then the workspace's saved ones. */
    async listTemplates(): Promise<TaskBoardTemplate[]> {
      return apiRequest<TaskBoardTemplate[]>({
        method: "GET",
        url: "/task-boards/templates",
      });
    },

    /** A board with the template's columns, groups and tasks. 404 for an unknown key. */
    async createFromTemplate(
      payload: TaskBoardFromTemplatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "POST",
        url: "/task-boards/from-template",
        data: payload,
      });
    },

    /** Keep a board's columns, groups and open tasks as a workspace template. */
    async saveAsTemplate(
      boardId: number,
      payload: TaskBoardTemplateSavePayload,
    ): Promise<TaskBoardTemplate> {
      return apiRequest<TaskBoardTemplate>({
        method: "POST",
        url: `/task-boards/${boardId}/save-as-template`,
        data: payload,
      });
    },

    // Workspace template management.

    /** One template with its full definition. `builtin:<slug>` or `workspace:<id>`; 404 otherwise. */
    async getTemplate(key: string): Promise<TaskBoardTemplateDetail> {
      return apiRequest<TaskBoardTemplateDetail>({
        method: "GET",
        url: `/task-boards/templates/${encodeURIComponent(key)}`,
      });
    },

    /** A saved template from a definition: Duplicate, or built by hand. */
    async createTemplate(
      payload: TaskBoardTemplateCreatePayload,
    ): Promise<TaskBoardTemplateDetail> {
      return apiRequest<TaskBoardTemplateDetail>({
        method: "POST",
        url: "/task-boards/templates",
        data: payload,
      });
    },

    /** Change a saved template. 403 unless an admin or the person who saved it. */
    async updateTemplate(
      templateId: number,
      payload: TaskBoardTemplateUpdatePayload,
    ): Promise<TaskBoardTemplateDetail> {
      return apiRequest<TaskBoardTemplateDetail>({
        method: "PATCH",
        url: `/task-boards/templates/${templateId}`,
        data: payload,
      });
    },

    /** Remove a saved template. 403 unless an admin or the person who saved it. */
    async removeTemplate(templateId: number): Promise<void> {
      await apiRequest<void>({
        method: "DELETE",
        url: `/task-boards/templates/${templateId}`,
      });
    },

    async update(
      boardId: number,
      payload: TaskBoardUpdatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PATCH",
        url: `/task-boards/${boardId}`,
        data: payload,
      });
    },

    async remove(boardId: number): Promise<void> {
      await apiRequest<void>({
        method: "DELETE",
        url: `/task-boards/${boardId}`,
      });
    },

    async createColumn(
      boardId: number,
      payload: TaskColumnCreatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "POST",
        url: `/task-boards/${boardId}/columns`,
        data: payload,
      });
    },

    /** Replaces the column order with these ids, in this order. */
    async reorderColumns(
      boardId: number,
      columnIds: number[],
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PUT",
        url: `/task-boards/${boardId}/columns/order`,
        data: { column_ids: columnIds },
      });
    },

    async updateColumn(
      boardId: number,
      columnId: number,
      payload: TaskColumnUpdatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PATCH",
        url: `/task-boards/${boardId}/columns/${columnId}`,
        data: payload,
      });
    },

    /** 409 when the column still holds tasks. */
    async removeColumn(
      boardId: number,
      columnId: number,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "DELETE",
        url: `/task-boards/${boardId}/columns/${columnId}`,
      });
    },

    async createGroup(
      boardId: number,
      payload: TaskGroupCreatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "POST",
        url: `/task-boards/${boardId}/groups`,
        data: payload,
      });
    },

    async updateGroup(
      boardId: number,
      groupId: number,
      payload: TaskGroupUpdatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PATCH",
        url: `/task-boards/${boardId}/groups/${groupId}`,
        data: payload,
      });
    },

    /** Replaces the group order with these ids, in this order. */
    async reorderGroups(
      boardId: number,
      groupIds: number[],
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PUT",
        url: `/task-boards/${boardId}/groups/order`,
        data: { group_ids: groupIds },
      });
    },

    async createField(
      boardId: number,
      payload: TaskFieldCreatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "POST",
        url: `/task-boards/${boardId}/fields`,
        data: payload,
      });
    },

    /** Removing a label option clears it on every task of the board. */
    async updateField(
      boardId: number,
      fieldId: number,
      payload: TaskFieldUpdatePayload,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PATCH",
        url: `/task-boards/${boardId}/fields/${fieldId}`,
        data: payload,
      });
    },

    async reorderFields(
      boardId: number,
      fieldIds: number[],
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "PUT",
        url: `/task-boards/${boardId}/fields/order`,
        data: { field_ids: fieldIds },
      });
    },

    /** Removes the column and its value from every task. */
    async removeField(
      boardId: number,
      fieldId: number,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "DELETE",
        url: `/task-boards/${boardId}/fields/${fieldId}`,
      });
    },

    /** A group with tasks needs `moveTo`, another group of the board (409 without it). */
    async removeGroup(
      boardId: number,
      groupId: number,
      moveTo?: number,
    ): Promise<TaskBoardDetail> {
      return apiRequest<TaskBoardDetail>({
        method: "DELETE",
        url: `/task-boards/${boardId}/groups/${groupId}${query({ move_to: moveTo })}`,
      });
    },
  };

  const tasksApi = {
    async attention(): Promise<TaskAttention> {
      return apiRequest<TaskAttention>({
        method: "GET",
        url: "/tasks/attention",
      });
    },

    async approveReview(taskId: number, runIds: number[]): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "POST",
        url: `/tasks/${taskId}/skill-review`,
        data: { run_ids: runIds },
      });
    },

    async skillRuns(taskId: number): Promise<TaskSkillRun[]> {
      return apiRequest<TaskSkillRun[]>({
        method: "GET",
        url: `/tasks/${taskId}/skill-runs`,
      });
    },

    async retrySkill(taskId: number, skillId: number): Promise<TaskSkillRun> {
      return apiRequest<TaskSkillRun>({
        method: "POST",
        url: `/tasks/${taskId}/skills/${skillId}/retry`,
      });
    },

    async list(filters: TaskListFilters = {}): Promise<TaskSummary[]> {
      return apiRequest<TaskSummary[]>({
        method: "GET",
        url: `/tasks${query({ ...filters })}`,
      });
    },

    async get(taskId: number): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({ method: "GET", url: `/tasks/${taskId}` });
    },

    async create(payload: TaskCreatePayload): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "POST",
        url: "/tasks",
        data: payload,
      });
    },

    async update(
      taskId: number,
      payload: TaskUpdatePayload,
    ): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "PATCH",
        url: `/tasks/${taskId}`,
        data: payload,
      });
    },

    /** Archives the task; `restore` brings it back. */
    async archive(taskId: number): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "DELETE",
        url: `/tasks/${taskId}`,
      });
    },

    async restore(taskId: number): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "POST",
        url: `/tasks/${taskId}/restore`,
      });
    },

    /** Delete for good, with subtasks, comments and history. 403 unless an admin or the creator. */
    async remove(taskId: number): Promise<void> {
      await apiRequest<void>({
        method: "POST",
        url: `/tasks/${taskId}/delete`,
      });
    },

    async move(taskId: number, payload: TaskMovePayload): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "POST",
        url: `/tasks/${taskId}/move`,
        data: payload,
      });
    },

    async addComment(taskId: number, body: string): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "POST",
        url: `/tasks/${taskId}/comments`,
        data: { body },
      });
    },

    async refreshAiCoverage(taskId: number): Promise<TaskDetail> {
      return apiRequest<TaskDetail>({
        method: "POST",
        url: `/tasks/${taskId}/ai-coverage`,
      });
    },
  };

  return {
    boards: taskBoardsApi,
    tasks: tasksApi,
    members: () =>
      apiRequest<{ members: WorkspaceMember[] }>({
        method: "GET",
        url: `/workspaces/${workspaceId}/members`,
      }),
    skills: () =>
      apiRequest<SkillChoice[]>({ method: "GET", url: "/skills/mine" }),
    questions: () =>
      apiRequest<PendingQuestionRecord[]>({
        method: "GET",
        url: "/questions/open",
      }),
    answer: (
      id: number,
      action: "accept" | "decline" | "cancel",
      answers?: Record<string, string | string[]>,
    ) =>
      apiRequest<{ continuation_queued?: boolean }>({
        method: "POST",
        url: `/questions/${id}/answer`,
        data: { action, ...(answers ? { answers } : {}) },
      }),
    runPermission: (runId: number, approvalId: number, approve: boolean) =>
      apiRequest<unknown>({
        method: "POST",
        url: `/agent-runs/${runId}/approvals/${approvalId}/${approve ? "approve" : "reject"}`,
        ...(approve ? { data: { dispatch_resume: true } } : {}),
      }),
    cancelRun: (id: number) =>
      apiRequest<unknown>({ method: "DELETE", url: `/agent-runs/${id}` }),
  };
}
export type TaskClient = ReturnType<typeof taskClient>;
