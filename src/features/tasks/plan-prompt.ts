/**
 * The chat prompt that turns a project description into a task board.
 *
 * The chat already has the knowledge-base search, the web search and the
 * `create_task_board` tool. This prompt ties them together: it tells the agent
 * where to look first, what shape the board takes, and to end with the link.
 * Pure, so it is tested without React.
 */

/** Match the web planner limit without carrying project content in a route URL. */
export const MAX_PLAN_DESCRIPTION = 2000;

export function buildPlanBoardPrompt(description: string): string {
  const text = description.trim().slice(0, MAX_PLAN_DESCRIPTION);
  return [
    `Create a task board for this project: ${text}`,
    "",
    "Steps:",
    "1. Search the knowledge base for material on this subject (plans, checklists, past projects, standards) and use it first.",
    "2. If the knowledge base has nothing useful, search the web for the standard steps and good practice.",
    "3. Create one board with create_task_board: the phases as groups, in order, and one task per step with a short description and a priority. Put the sources you used in the board description.",
    "4. Reply with a short summary of the phases and the board link exactly as the tool returns it.",
  ].join("\n");
}
