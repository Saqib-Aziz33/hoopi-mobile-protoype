const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { QueryClient } = require("@tanstack/react-query");
function load(file, dependencies = {}) {
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src", file + ".ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const result = {};
  new Function("require", "exports", code)(
    (id) => (Object.hasOwn(dependencies, id) ? dependencies[id] : require(id)),
    result,
  );
  return result;
}
const model = load("features/tasks/model");
const filter = load("features/tasks/filter");
const bulk = load("features/tasks/bulk", { "./model": model });
const order = load("features/tasks/board-order");
const { buildPlanBoardPrompt } = load("features/tasks/plan-prompt");
const { taskKey } = load("features/tasks/query-keys");
const task = (id, values = {}) => ({
  id,
  board_id: 10,
  column_id: 1,
  group_id: 1,
  group_position: id,
  position: id,
  parent_task_id: null,
  title: `Task ${id}`,
  description: "",
  priority: "medium",
  due_at: null,
  completed_at: null,
  is_archived: false,
  labels: [],
  assignees: [],
  skills: [],
  custom_values: {},
  ...values,
});
const board = (tasks) => ({
  id: 10,
  name: "Demo",
  tasks,
  columns: [
    { id: 1, name: "To do" },
    { id: 2, name: "Done" },
  ],
  groups: [{ id: 1, name: "Phase 1", position: 0 }],
  priority_labels: [{ key: "medium", name: "Medium" }],
  fields: [],
});

test("task stats count root tasks and exclude archived/completed work from overdue", () => {
  const data = board([
    task(1, { due_at: "2026-01-01T12:00:00Z" }),
    task(2, {
      due_at: "2026-01-01T12:00:00Z",
      completed_at: "2026-01-01T13:00:00Z",
    }),
    task(3, { parent_task_id: 1 }),
    task(4, { is_archived: true }),
  ]);
  assert.deepEqual(model.boardStats(data, new Date("2026-02-01T12:00:00Z")), {
    total: 2,
    done: 1,
    open: 1,
    overdue: 1,
    progress: 50,
  });
});
test("agent polling follows backend active states and stops after completion", () => {
  assert.equal(model.hasActiveAgents(undefined), false);
  for (const status of [
    "pending",
    "queued",
    "running",
    "awaiting_approval",
    "waiting_input",
  ])
    assert.equal(
      model.hasActiveAgents(task(1, { skills: [{ last_run: { status } }] })),
      true,
    );
  for (const status of ["completed", "failed", "canceled"])
    assert.equal(
      model.hasActiveAgents(task(1, { skills: [{ last_run: { status } }] })),
      false,
    );
  assert.equal(model.overdue(task(1, { due_at: "invalid" })), false);
});
test("all filter criteria apply, including any assignee and agent-only assignment", () => {
  const data = task(1, {
    title: "Prepare product launch",
    labels: ["Marketing"],
    assignees: [
      { user_id: 2, name: "Alex" },
      { user_id: 3, name: "Sam" },
    ],
  });
  assert.equal(filter.matches(data, "launch sam", "medium", 3, 1), true);
  assert.equal(filter.matches(data, "launch sam", "urgent", 3, 1), false);
  assert.equal(filter.matches(data, "", "all", "unassigned"), false);
  assert.equal(
    filter.matches(
      task(2, { skills: [{ skill_id: 1, name: "Researcher" }] }),
      "",
      "all",
      "unassigned",
    ),
    false,
  );
  assert.equal(filter.matches(task(3), "", "all", "unassigned"), true);
  assert.equal(filter.matches(data, "", "all", "monitor:2"), false);
});
test("due dates use local noon, reject impossible dates, and round-trip a leap day", () => {
  assert.equal(model.dayKey(model.dueOnDay("2028-02-29")), "2028-02-29");
  assert.equal(new Date(model.dueOnDay("2028-02-29")).getHours(), 12);
  assert.throws(() => model.dueOnDay("2027-02-29"));
  assert.throws(() => model.dueOnDay("2026-13-01"));
  assert.equal(model.dayKey("invalid"), "");
});
test("route ids accept only positive safe integers", () => {
  assert.equal(model.numericId("42"), 42);
  for (const value of [
    "0",
    "-1",
    "NaN",
    "1.5",
    "1e2",
    " 42",
    "9007199254740992",
    undefined,
  ])
    assert.equal(model.numericId(value), null);
});
test("attention merges questions, legacy permissions and reviews per task and board", () => {
  const queue = {
    questions: [
      {
        task_id: 1,
        board_id: 10,
        task_title: "Review launch",
        kind: "question",
      },
      {
        task_id: 1,
        board_id: 10,
        task_title: "Review launch",
        kind: "approval",
      },
      { task_id: null },
    ],
    approvals: [{ task_id: 2, board_id: 11, task_title: "Other board" }],
    reviews: [{ task_id: 1, board_id: 10, task_title: "Review launch" }],
  };
  assert.deepEqual(model.attentionItems(queue, 10), [
    {
      taskId: 1,
      boardId: 10,
      title: "Review launch",
      input: 1,
      approval: 1,
      review: 1,
    },
  ]);
});
test("duplicate preserves placement, people and custom values but excludes running agents and history", () => {
  const duplicate = model.duplicatePayload(
    task(1, {
      title: "A".repeat(200),
      parent_task_id: 9,
      assignees: [{ user_id: 3 }],
      skills: [{ skill_id: 8 }],
      custom_values: { 2: 0 },
    }),
  );
  assert.equal(duplicate.title.length, 200);
  assert.equal(duplicate.parent_task_id, 9);
  assert.equal("group_id" in duplicate, false);
  assert.deepEqual(duplicate.assignee_user_ids, [3]);
  assert.deepEqual(duplicate.custom_values, { 2: 0 });
  assert.equal("skill_ids" in duplicate, false);
  assert.equal("activity" in duplicate, false);
});
test("drag order is immutable and renumbers both lanes without losing tasks", () => {
  const tasks = [
    task(1, { position: 0 }),
    task(2, { position: 1 }),
    task(3, { column_id: 2, position: 0 }),
  ];
  const moved = order.moveTask(tasks, 1, 2, 1);
  assert.deepEqual(
    moved.map((task) => [task.id, task.column_id, task.position]),
    [
      [1, 2, 1],
      [2, 1, 0],
      [3, 2, 0],
    ],
  );
  assert.equal(tasks[0].column_id, 1);
  assert.deepEqual(order.reorderIds([1, 2, 3], 1, 2), [2, 3, 1]);
});
test("a filtered root-task reorder leaves subtask positions untouched", () => {
  const tasks = [
    task(1, { position: 0 }),
    task(2, { position: 1 }),
    task(3, { parent_task_id: 1, position: 0 }),
  ];
  const roots = new Map(
    order
      .moveTask(model.topLevel(tasks), 2, 1, 0)
      .map((task) => [task.id, task]),
  );
  const next = tasks.map((task) => roots.get(task.id) ?? task);
  assert.equal(next[2], tasks[2]);
  assert.equal(next[1].position, 0);
});
test("bulk actions cap concurrency, report failures in selection order, and retain successful work", async () => {
  let active = 0;
  let maximum = 0;
  const result = await bulk.runBulk([1, 2, 3, 4, 5, 6], async (id) => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    if ([2, 5].includes(id)) throw new Error("Denied");
  });
  assert.equal(maximum, 4);
  assert.deepEqual(result, { ok: [1, 3, 4, 6], failed: [2, 5] });
  assert.equal(
    bulk.bulkMessage("Archived", result),
    "Archived 4 of 6 tasks. 2 could not be changed.",
  );
});
test("CSV export escapes cells, blocks formula injection and formats People fields", () => {
  const data = board([
    task(1, {
      title: '=HYPERLINK("bad")',
      assignees: [{ user_id: 2, name: "Alex" }],
      custom_values: {
        4: [
          { kind: "user", id: 2 },
          { kind: "agent", id: 7 },
        ],
      },
      skills: [{ skill_id: 7, name: "Researcher" }],
    }),
  ]);
  data.fields = [
    { id: 4, name: "Owners", type: "people", position: 0, options: [] },
  ];
  const csv = bulk.tasksToCsv(data, data.tasks);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes("Alex; Researcher"));
  assert.ok(!csv.includes("[object Object]"));
  assert.equal(bulk.csvCell("a,b"), '"a,b"');
});
test("planning constrains prompt length and recognizes accumulated links and structured tool results", () => {
  const prompt = buildPlanBoardPrompt(" X ".repeat(2000));
  assert.ok(prompt.includes("create_task_board"));
  assert.ok(prompt.length < 3000);
  assert.equal(model.plannedBoardId("Your board: /dashboard/tasks/"), null);
  assert.equal(
    model.plannedBoardId("Your board: /dashboard/tasks/" + "142"),
    142,
  );
  assert.equal(model.plannedBoardId({ board_id: 42 }), 42);
  assert.equal(model.plannedBoardId('{"board_id":31}'), 31);
  assert.equal(model.plannedBoardId("No board yet"), null);
});

function apiFixture(responder) {
  const requests = [];
  const storage = new Map([
    ["hoopi_access_token", "local-test-token"],
    ["hoopi_workspace_id", "7"],
  ]);
  const original = global.fetch;
  global.fetch = async (url, init) => {
    const request = {
      url,
      ...init,
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(init.body) : undefined,
    };
    requests.push(request);
    return responder
      ? responder(request, requests.length)
      : new Response(JSON.stringify({ id: 12 }), { status: 200 });
  };
  const api = load("lib/api", {
    "expo-secure-store": {
      getItemAsync: async (key) => storage.get(key) ?? null,
      setItemAsync: async (key, value) => storage.set(key, value),
      deleteItemAsync: async (key) => storage.delete(key),
    },
    "./event-stream": load("lib/event-stream"),
  });
  const { taskClient } = load("features/tasks/api", { "@/lib/api": api });
  return {
    requests,
    storage,
    api,
    taskClient,
    restore: () => {
      global.fetch = original;
    },
  };
}
test("task API pins workspace headers independently of the currently selected workspace", async () => {
  const fixture = apiFixture();
  try {
    fixture.storage.set("hoopi_workspace_id", "99");
    await fixture
      .taskClient(7)
      .tasks.create({ board_id: 10, title: "Test task" });
    assert.equal(fixture.requests[0].headers.get("X-Workspace-Id"), "7");
    assert.equal(
      fixture.requests[0].headers.get("Authorization"),
      "Bearer local-test-token",
    );
    assert.deepEqual(fixture.requests[0].body, {
      board_id: 10,
      title: "Test task",
    });
    await fixture.api.api("/files");
    assert.equal(fixture.requests[1].headers.get("X-Workspace-Id"), "99");
  } finally {
    fixture.restore();
  }
});
test("refreshing an expired access token retains the initiating workspace on retry", async () => {
  const fixture = apiFixture((request) =>
    request.url.endsWith("/auth/refresh")
      ? new Response(JSON.stringify({ access_token: "renewed-test-token" }))
      : request.headers.get("Authorization") === "Bearer local-test-token"
        ? new Response("{}", { status: 401 })
        : new Response("[]"),
  );
  try {
    fixture.storage.set("hoopi_workspace_id", "99");
    await fixture.taskClient(7).boards.list();
    const calls = fixture.requests.filter((request) =>
      request.url.includes("/task-boards"),
    );
    assert.equal(calls.length, 2);
    assert.ok(
      calls.every((request) => request.headers.get("X-Workspace-Id") === "7"),
    );
    assert.equal(
      calls[1].headers.get("Authorization"),
      "Bearer renewed-test-token",
    );
  } finally {
    fixture.restore();
  }
});
test("query cache separates identical board ids across workspaces, including late responses", async () => {
  let release;
  const fixture = apiFixture((request) =>
    request.headers.get("X-Workspace-Id") === "7"
      ? new Promise((resolve) => {
          release = () =>
            resolve(
              new Response(JSON.stringify({ id: 10, name: "Workspace seven" })),
            );
        })
      : new Response(JSON.stringify({ id: 10, name: "Workspace eight" })),
  );
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  try {
    const first = cache.fetchQuery({
      queryKey: taskKey(7, "board", 10),
      queryFn: () => fixture.taskClient(7).boards.get(10),
    });
    await new Promise((resolve) => setImmediate(resolve));
    await cache.fetchQuery({
      queryKey: taskKey(8, "board", 10),
      queryFn: () => fixture.taskClient(8).boards.get(10),
    });
    release();
    await first;
    assert.equal(
      cache.getQueryData(taskKey(7, "board", 10)).name,
      "Workspace seven",
    );
    assert.equal(
      cache.getQueryData(taskKey(8, "board", 10)).name,
      "Workspace eight",
    );
  } finally {
    fixture.restore();
    cache.clear();
  }
});
test("API archive, restore and permanent delete use distinct backend contracts", async () => {
  const fixture = apiFixture();
  try {
    const api = fixture.taskClient(7).tasks;
    await api.archive(12);
    await api.restore(12);
    await api.remove(12);
    assert.deepEqual(
      fixture.requests.map((request) => [
        request.method,
        new URL(request.url).pathname,
      ]),
      [
        ["DELETE", "/api/v1/tasks/12"],
        ["POST", "/api/v1/tasks/12/restore"],
        ["POST", "/api/v1/tasks/12/delete"],
      ],
    );
  } finally {
    fixture.restore();
  }
});
test("API preserves explicit clearing values and false filters; template keys are escaped", async () => {
  const fixture = apiFixture();
  try {
    const api = fixture.taskClient(7);
    await api.tasks.update(12, {
      assignee_user_ids: [],
      skill_ids: [],
      clear_due_at: true,
      custom_values: { 2: 0, 3: null },
    });
    assert.deepEqual(fixture.requests[0].body, {
      assignee_user_ids: [],
      skill_ids: [],
      clear_due_at: true,
      custom_values: { 2: 0, 3: null },
    });
    await api.tasks.list({ search: "hello & friends", include_done: false });
    const search = new URL(fixture.requests[1].url).searchParams;
    assert.equal(search.get("include_done"), "false");
    assert.equal(search.get("search"), "hello & friends");
    await api.boards.getTemplate("builtin:launch/test");
    assert.ok(
      fixture.requests[2].url.endsWith("/templates/builtin%3Alaunch%2Ftest"),
    );
  } finally {
    fixture.restore();
  }
});
test("question answers preserve scalar versus multiple selections and never imply acceptance", async () => {
  const fixture = apiFixture();
  try {
    await fixture
      .taskClient(7)
      .answer(12, "accept", { Audience: ["A", "B"], Notes: "A custom answer" });
    await fixture.taskClient(7).answer(13, "decline");
    await fixture.taskClient(7).answer(14, "cancel");
    assert.deepEqual(fixture.requests[0].body.answers, {
      Audience: ["A", "B"],
      Notes: "A custom answer",
    });
    assert.deepEqual(fixture.requests[1].body, { action: "decline" });
    assert.deepEqual(fixture.requests[2].body, { action: "cancel" });
  } finally {
    fixture.restore();
  }
});
test("aborted task queries pass their signal to fetch, and forbidden responses retain status", async () => {
  const fixture = apiFixture(
    () =>
      new Response(
        JSON.stringify({ detail: "This workspace does not allow Tasks." }),
        { status: 403 },
      ),
  );
  try {
    const controller = new AbortController();
    await assert.rejects(
      fixture.taskClient(7, controller.signal).boards.list(),
      (error) =>
        error instanceof fixture.api.ApiError &&
        error.status === 403 &&
        /does not allow/.test(error.message),
    );
    assert.equal(fixture.requests[0].signal, controller.signal);
  } finally {
    fixture.restore();
  }
});
