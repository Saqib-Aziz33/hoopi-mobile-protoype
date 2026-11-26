// Task contracts mirrored from the reference web API.
/** A key of the board's priority list. The defaults are "low", "medium", "high" and "urgent". */
export type TaskPriority = string;
export type TaskColumnCategory = "backlog" | "active" | "done";
export type TaskActivityKind =
  | "created"
  | "updated"
  | "moved"
  | "assigned"
  | "commented"
  | "archived"
  | "restored";

export interface TaskBoardSummary {
  id: number;
  name: string;
  description: string;
  position: number;
  is_archived: boolean;
  auto_ai_coverage?: boolean;
  column_count: number;
  task_count: number;
  open_task_count: number;
  /** The board's priorities, from the lowest to the highest. */
  priority_labels: TaskPriorityLabel[];
  created_at: string;
  updated_at: string;
}

export interface TaskPriorityLabel {
  key: TaskPriority;
  name: string;
  color: string;
}

export type TaskFieldType = "text" | "number" | "date" | "label" | "people";

export interface TaskFieldOption {
  id: string;
  name: string;
  color: string;
}

/** A board's custom column. Values live on each task in `custom_values`, keyed by the id as a string. */
export interface TaskField {
  id: number;
  board_id: number;
  name: string;
  type: TaskFieldType;
  position: number;
  options: TaskFieldOption[];
}

/** One entry of a People column (issue #186): a workspace member or an agent. */
export interface PersonRef {
  kind: "user" | "agent";
  id: number;
}

/** A text, number, date ("YYYY-MM-DD"), label option id, or a People list. */
export type TaskFieldValue = string | number | PersonRef[];

export interface TaskFieldCreatePayload {
  name: string;
  type: TaskFieldType;
  options?: { id?: string; name: string; color: string }[];
}

export interface TaskFieldUpdatePayload {
  name?: string;
  options?: { id?: string; name: string; color: string }[];
}

export interface TaskAssignee {
  user_id: number;
  name: string | null;
}

/** A monitor watching a task, shown with its persona. */
export interface TaskMonitor {
  job_id: number;
  name: string;
  role: string;
  persona_key: string;
  is_active: boolean;
}

export interface TaskColumn {
  is_skill_review?: boolean;
  id: number;
  board_id: number;
  name: string;
  position: number;
  color: string | null;
  category: TaskColumnCategory;
  task_count: number;
}

/** A named, ordered section of a board's table view. Independent of the column (the status). */
export interface TaskGroup {
  id: number;
  board_id: number;
  name: string;
  position: number;
  /** "#rrggbb", or null for the default colour. */
  color: string | null;
  task_count: number;
}

export interface TaskSkillRun {
  id: number;
  skill_id: number | null;
  skill_name: string;
  status: string;
  result_summary: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TaskResultReview {
  task_id: number;
  board_id: number;
  task_title: string;
  run_ids: number[];
  skill_names: string[];
}

export interface TaskToolApproval {
  id: number;
  run_id: number;
  task_id: number;
  board_id: number;
  task_title: string;
  skill_name: string;
  tool_name: string;
  integration_slug: string;
  tool_args: string | null;
  requested_at: string;
}

export interface TaskAttention {
  questions: PendingQuestionRecord[];
  approvals: TaskToolApproval[];
  reviews: TaskResultReview[];
  running_now: number;
  needs_review: number;
  completed_today: number;
}

export interface TaskSkill {
  skill_id: number;
  name: string;
  slug?: string;
  description?: string;
  tags?: string[];
  persona_name?: string | null;
  avatar_key?: string | null;
  avatar_color?: string | null;
  last_run?: TaskSkillRun | null;
}

export interface TaskSummary {
  skills?: TaskSkill[];
  id: number;
  board_id: number;
  column_id: number;
  title: string;
  description: string;
  /** 0-based within its column. */
  position: number;
  /** The task's group. Null only for an old row; it reads as the board's first group. */
  group_id: number | null;
  /** 0-based within its group. */
  group_position: number;
  priority: TaskPriority;
  due_at: string | null;
  /** The first assignee, for old code. `assignees` has them all. */
  assignee_user_id: number | null;
  assignee_name: string | null;
  assignees: TaskAssignee[];
  /** Monitors that watch the task on their own schedule. */
  monitors?: TaskMonitor[];
  labels: string[];
  completed_at: string | null;
  is_archived: boolean;
  comment_count: number;
  /** Set on a subtask. A subtask is not a Kanban card. */
  parent_task_id: number | null;
  subtask_count: number;
  subtask_done_count: number;
  custom_values: Record<string, TaskFieldValue>;
  ai_coverage_percent?: number | null;
  ai_coverage_label?: string | null;
  created_by_user_id: number | null;
  created_by_agent_run_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: number;
  kind: TaskActivityKind;
  /** The comment text; empty for every other kind. */
  body: string;
  /** The changed fields; for "moved": from_column_name and to_column_name. */
  payload: Record<string, unknown>;
  actor_user_id: number | null;
  actor_name: string | null;
  /** Set when an agent run made the change. */
  agent_run_id: number | null;
  /** Set when a monitor's run made the change: its persona. */
  monitor_job_id?: number | null;
  monitor_name?: string | null;
  monitor_persona_key?: string | null;
  created_at: string;
}

export interface TaskDetail extends TaskSummary {
  board_name: string;
  column_name: string;
  activity: TaskActivity[];
  parent_title: string | null;
  subtasks: TaskSummary[];
}

/** The whole board in one response: the Kanban page's single query. */
export interface TaskBoardDetail extends TaskBoardSummary {
  columns: TaskColumn[];
  groups: TaskGroup[];
  fields: TaskField[];
  tasks: TaskSummary[];
}

export interface TaskGroupCreatePayload {
  name: string;
  color?: string | null;
}

export interface TaskGroupUpdatePayload {
  name?: string;
  color?: string | null;
}

export interface TaskBoardCreatePayload {
  name: string;
  description?: string;
  auto_ai_coverage?: boolean;
}

/** One entry of the board template picker (issue #184). `key` is `builtin:<slug>` or `workspace:<id>`. */
export interface TaskBoardTemplate {
  key: string;
  /** Set for a saved template only. */
  id: number | null;
  is_builtin: boolean;
  name: string;
  description: string;
  icon: string | null;
  columns: string[];
  groups: string[];
  task_count: number;
  sample_tasks: string[];
  created_by_user_id: number | null;
  created_at: string | null;
  /** A saved template the caller may delete: an admin, or the person who saved it. */
  can_delete: boolean;
  /** Same rule as `can_delete` (issue #185). Never true for a built-in. */
  can_edit: boolean;
}

// Board template definitions (issue #185). Names, not ids: a template is
// independent of the board it came from.

export interface TaskBoardTemplateColumn {
  name: string;
  category: TaskColumnCategory;
  color?: string | null;
}

export interface TaskBoardTemplateGroup {
  name: string;
  color?: string | null;
}

export interface TaskBoardTemplateTask {
  title: string;
  description: string;
  /** One of the template's group names. Null: the first group. */
  group: string | null;
  /** One of the template's column names. Null: the first column. */
  column: string | null;
  /** low, medium, high, urgent. Null: the board's default. */
  priority: string | null;
}

export interface TaskBoardTemplateFieldOption {
  name: string;
  color: string;
}

/** A board's own column in a template: text, number, date, or a label dropdown. */
export interface TaskBoardTemplateField {
  name: string;
  type: TaskFieldType;
  options: TaskBoardTemplateFieldOption[];
}

export interface TaskBoardTemplateDefinition {
  /** Status lanes. */
  columns: TaskBoardTemplateColumn[];
  groups: TaskBoardTemplateGroup[];
  /** The board's own columns. */
  fields: TaskBoardTemplateField[];
  tasks: TaskBoardTemplateTask[];
}

export interface TaskBoardTemplateDetail extends TaskBoardTemplate {
  definition: TaskBoardTemplateDefinition;
  updated_at: string | null;
}

export interface TaskBoardTemplateCreatePayload {
  name: string;
  description?: string;
  icon?: string | null;
  definition: TaskBoardTemplateDefinition;
}

export interface TaskBoardTemplateUpdatePayload {
  name?: string;
  description?: string;
  icon?: string | null;
  definition?: TaskBoardTemplateDefinition;
}

export interface TaskBoardFromTemplatePayload {
  template_key: string;
  /** Omitted: the template's name. */
  name?: string;
  /** Omitted: the template's description. */
  description?: string;
}

export interface TaskBoardTemplateSavePayload {
  name: string;
  description?: string;
  icon?: string | null;
}

export interface TaskBoardUpdatePayload {
  name?: string;
  description?: string;
  is_archived?: boolean;
  auto_ai_coverage?: boolean;
  /** The full list, lowest first (omit `key` for a new one), or null to reset to the defaults. */
  priority_labels?: { key?: string; name: string; color: string }[] | null;
  /** {removed key: kept key} for the tasks that use a removed priority. */
  priority_replacements?: Record<string, string>;
}

export interface TaskColumnCreatePayload {
  name: string;
  category?: TaskColumnCategory;
  color?: string | null;
  position?: number;
}

export interface TaskColumnUpdatePayload {
  name?: string;
  category?: TaskColumnCategory;
  color?: string | null;
}

export interface TaskCreatePayload {
  skill_ids?: number[];
  board_id: number;
  /** Omitted: the board's first column. */
  column_id?: number;
  /** Omitted: the board's first group. */
  group_id?: number;
  /** Makes it a subtask of this top-level task. */
  parent_task_id?: number;
  assignee_user_ids?: number[];
  custom_values?: Record<string, TaskFieldValue>;
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_at?: string | null;
  assignee_user_id?: number | null;
  labels?: string[];
  /** Omitted: the end of the column. */
  position?: number;
}

export interface TaskUpdatePayload {
  skill_ids?: number[];
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_at?: string;
  clear_due_at?: boolean;
  assignee_user_id?: number;
  clear_assignee?: boolean;
  labels?: string[];
  /** Moves the task to the end of this group. The column does not change. */
  group_id?: number;
  /** Replaces every assignee; [] clears them. */
  assignee_user_ids?: number[];
  /** Replaces the monitors that watch the task (at most 5); [] clears them. */
  monitor_ids?: number[];
  /** A merge: a key sets that column's value, null clears it. */
  custom_values?: Record<string, TaskFieldValue | null>;
}

export interface TaskMovePayload {
  column_id: number;
  /** Omitted: the end of the target column. */
  position?: number;
}

export interface TaskListFilters {
  board_id?: number;
  column_id?: number;
  assignee_user_id?: number;
  search?: string;
  due_before?: string;
  include_done?: boolean;
  include_archived?: boolean;
}

export interface PendingQuestionRecord {
  task_id?: number | null;
  board_id?: number | null;
  task_title?: string | null;
  skill_name?: string | null;
  id: number;
  run_id: number;
  kind: "question" | "approval";
  status: string;
  /** The conversation's `thread_key` — what ties a pause to a loaded transcript. */
  thread_id: string;
  payload: {
    version?: number;
    tool_name?: string | null;
    questions?: {
      header: string;
      question: string;
      options?: { value: string; label?: string | null }[];
      allow_multiple?: boolean;
      recommended?: string | null;
    }[];
    args?: Record<string, unknown>;
  };
  recommended?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface WorkspaceMember {
  user_id: number;
  full_name: string | null;
  email: string;
  status: string;
  role: string;
}
export interface SkillChoice extends TaskSkill {
  id: number;
  is_active: boolean;
}
