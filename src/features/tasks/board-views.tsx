import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, type DateData } from "react-native-calendars";
import DraggableFlatList from "react-native-draggable-flatlist";
import { C, editorialFont } from "@/components/ui";
import type { TaskBoardDetail, TaskSummary } from "./types";
import { boardStats, dayKey, dateLabel, overdue } from "./model";
import { Action, Chip, Empty, Section, s } from "./ui";

export type BoardView =
  | "list"
  | "board"
  | "calendar"
  | "timeline"
  | "dashboard";
export type ViewProps = {
  board: TaskBoardDetail;
  tasks: TaskSummary[];
  onOpen: (id: number) => void;
  onStatus: (task: TaskSummary) => void;
  selected: Set<number> | null;
  onSelect: (id: number) => void;
  refresh: () => void;
  refreshing: boolean;
  onReorder: (task: TaskSummary, position: number) => void;
  canDrag: boolean;
  onCreate: (due?: string, group?: number) => void;
};

export function TaskCard({
  task,
  board,
  onPress,
  onStatus,
  selected,
  onSelect,
  drag,
  dragging = false,
}: {
  task: TaskSummary;
  board: TaskBoardDetail;
  onPress: () => void;
  onStatus: () => void;
  selected?: boolean;
  onSelect?: () => void;
  drag?: () => void;
  dragging?: boolean;
}) {
  const column = board.columns.find((column) => column.id === task.column_id);
  const priority = board.priority_labels.find(
    (priority) => priority.key === task.priority,
  );
  return (
    <View
      style={[
        s.card,
        {
          padding: 16,
          gap: 10,
          backgroundColor: dragging || selected ? C.lavender : C.paper,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        {onSelect ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Select ${task.title}`}
            accessibilityState={{ checked: selected }}
            onPress={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={selected ? "checkbox" : "square-outline"}
              size={23}
              color={C.primary}
            />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${task.title}`}
          onPress={onPress}
          onLongPress={drag}
          delayLongPress={250}
          disabled={dragging}
          style={{
            flex: 1,
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{
              color: C.ink,
              fontFamily: editorialFont,
              fontSize: 17,
              lineHeight: 25,
              flex: 1,
            }}
          >
            {task.title}
          </Text>
          {drag ? (
            <Ionicons name="reorder-two-outline" size={20} color={C.muted} />
          ) : null}
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change status for ${task.title}, currently ${column?.name ?? "Unknown"}`}
          onPress={(event) => {
            event.stopPropagation();
            onStatus();
          }}
          style={{
            minHeight: 44,
            flexDirection: "row",
            gap: 5,
            alignItems: "center",
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: C.canvas,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: column?.color ?? C.primary,
            }}
          />
          <Text style={{ fontSize: 11, color: C.moss }}>{column?.name}</Text>
          <Ionicons name="chevron-down" size={10} color={C.muted} />
        </Pressable>
        {priority ? (
          <Text style={{ fontSize: 11, color: priority.color }}>
            {priority.name}
          </Text>
        ) : null}
        {task.due_at ? (
          <Text style={{ fontSize: 11, color: overdue(task) ? C.red : C.moss }}>
            {dateLabel(task.due_at)}
          </Text>
        ) : null}
      </View>
      {task.assignees?.length || task.subtask_count || task.comment_count ? (
        <Text style={s.hint}>
          {[
            task.assignees?.map((person) => person.name ?? "Member").join(", "),
            task.subtask_count
              ? `${task.subtask_done_count}/${task.subtask_count} subtasks`
              : "",
            task.comment_count ? `${task.comment_count} comments` : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      ) : null}
      {task.skills?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {task.skills.map((skill) => (
            <Chip
              key={skill.skill_id}
              label={`${skill.name} · ${skill.last_run?.status?.replaceAll("_", " ") ?? "Assigned"}`}
            />
          ))}
        </View>
      ) : null}
      {task.ai_coverage_percent != null ? (
        <Text style={{ color: C.primary, fontSize: 11 }}>
          ✦ {task.ai_coverage_percent}% AI coverage
          {task.ai_coverage_label ? ` · ${task.ai_coverage_label}` : ""}
        </Text>
      ) : null}
    </View>
  );
}

export function BoardViews({
  view,
  ...props
}: ViewProps & { view: BoardView }) {
  if (view === "board") return <Kanban {...props} />;
  if (view === "calendar") return <CalendarView {...props} />;
  if (view === "timeline") return <Timeline {...props} />;
  if (view === "dashboard") return <Dashboard {...props} />;
  return <GroupedList {...props} />;
}
function renderCard(
  task: TaskSummary,
  props: ViewProps,
  drag?: () => void,
  dragging?: boolean,
) {
  return (
    <TaskCard
      task={task}
      board={props.board}
      onPress={() => props.onOpen(task.id)}
      onStatus={() => props.onStatus(task)}
      selected={props.selected?.has(task.id)}
      onSelect={props.selected ? () => props.onSelect(task.id) : undefined}
      drag={drag}
      dragging={dragging}
    />
  );
}
function GroupedList(props: ViewProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const groups = props.board.groups.length
    ? [...props.board.groups].sort((a, b) => a.position - b.position)
    : [{ id: 0, name: "Tasks", color: C.primary, position: 0 }];
  const sections = groups.map((group, index) => {
    const tasks = props.tasks
      .filter(
        (task) =>
          task.group_id === group.id || (index === 0 && task.group_id == null),
      )
      .sort((a, b) => a.group_position - b.group_position || a.id - b.id);
    return {
      ...group,
      count: tasks.length,
      data: collapsed.has(group.id) ? [] : tasks,
    };
  });
  return (
    <SectionList
      sections={sections}
      keyExtractor={(task) => String(task.id)}
      contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.refresh}
          tintColor={C.primary}
        />
      }
      renderSectionHeader={({ section }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
            marginBottom: 10,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: !collapsed.has(section.id) }}
            onPress={() =>
              setCollapsed((old) => {
                const next = new Set(old);
                if (next.has(section.id)) next.delete(section.id);
                else next.add(section.id);
                return next;
              })
            }
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
            }}
          >
            <Ionicons
              name={
                collapsed.has(section.id) ? "chevron-forward" : "chevron-down"
              }
              size={15}
              color={section.color ?? C.primary}
            />
            <Text style={{ color: C.ink, fontWeight: "600", fontSize: 15 }}>
              {section.name}
            </Text>
            <Text style={s.hint}>{section.count}</Text>
          </Pressable>
          {!props.board.is_archived ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add task to ${section.name}`}
              onPress={() => props.onCreate(undefined, section.id || undefined)}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={21} color={C.primary} />
            </Pressable>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 10 }}>{renderCard(item, props)}</View>
      )}
      renderSectionFooter={({ section }) =>
        !section.count && !collapsed.has(section.id) ? (
          <Text style={[s.hint, { marginBottom: 18 }]}>
            No tasks in this group.
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <Empty
          title="No tasks match"
          message="Clear your filters or add a task."
        />
      }
    />
  );
}
function Kanban(props: ViewProps) {
  const { width } = useWindowDimensions();
  const laneWidth = Math.min(width - 54, 330);
  return (
    <ScrollView
      horizontal
      decelerationRate="fast"
      snapToInterval={laneWidth + 14}
      contentContainerStyle={{
        paddingHorizontal: 22,
        gap: 14,
        paddingBottom: 12,
      }}
      showsHorizontalScrollIndicator={false}
    >
      {[...props.board.columns]
        .sort((a, b) => a.position - b.position)
        .map((column) => {
          const tasks = props.tasks
            .filter((task) => task.column_id === column.id)
            .sort((a, b) => a.position - b.position || a.id - b.id);
          return (
            <View
              key={column.id}
              style={{
                width: laneWidth,
                flex: 1,
                borderRadius: 16,
                backgroundColor: C.line + "50",
                padding: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: column.color ?? C.primary,
                  }}
                />
                <Text style={{ flex: 1, color: C.ink, fontWeight: "600" }}>
                  {column.name}
                </Text>
                <Text style={s.hint}>{tasks.length}</Text>
              </View>
              <DraggableFlatList
                data={tasks}
                keyExtractor={(task) => String(task.id)}
                activationDistance={8}
                containerStyle={{ flex: 1 }}
                contentContainerStyle={{
                  gap: 10,
                  paddingBottom: 12,
                  flexGrow: 1,
                }}
                onDragEnd={({ from, to, data }) => {
                  if (from !== to) props.onReorder(data[to], to);
                }}
                renderItem={({ item, drag, isActive }) =>
                  renderCard(
                    item,
                    props,
                    props.canDrag ? drag : undefined,
                    isActive,
                  )
                }
                ListEmptyComponent={
                  <Text style={[s.hint, { padding: 12 }]}>
                    A little room for what’s next.
                  </Text>
                }
              />
            </View>
          );
        })}
    </ScrollView>
  );
}
function CalendarView(props: ViewProps) {
  const [selected, setSelected] = useState(dayKey(new Date()));
  const marked = useMemo(() => {
    const result: Record<
      string,
      {
        dots: { key: string; color: string }[];
        marked?: boolean;
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};
    for (const task of props.tasks) {
      const day = dayKey(task.due_at);
      if (!day) continue;
      const dot = {
        key: String(task.column_id),
        color:
          props.board.columns.find((column) => column.id === task.column_id)
            ?.color ?? C.primary,
      };
      result[day] ??= { dots: [], marked: true };
      if (!result[day].dots.some((existing) => existing.key === dot.key))
        result[day].dots.push(dot);
    }
    result[selected] = {
      ...result[selected],
      dots: result[selected]?.dots ?? [],
      selected: true,
      selectedColor: C.primary,
    };
    return result;
  }, [props.tasks, props.board.columns, selected]);
  const scheduled = props.tasks.filter(
    (task) => dayKey(task.due_at) === selected,
  );
  return (
    <FlatList
      data={scheduled}
      keyExtractor={(task) => String(task.id)}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 22, gap: 12, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.refresh}
          tintColor={C.primary}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 12 }}>
          <Calendar
            markingType="multi-dot"
            markedDates={marked}
            onDayPress={(day: DateData) => setSelected(day.dateString)}
            theme={{
              backgroundColor: C.canvas,
              calendarBackground: C.canvas,
              textSectionTitleColor: C.moss,
              dayTextColor: C.ink,
              monthTextColor: C.ink,
              todayTextColor: C.primary,
              arrowColor: C.primary,
              textDisabledColor: C.muted,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.section}>{dateLabel(`${selected}T12:00:00`)}</Text>
              <Text style={s.hint}>
                {props.tasks.filter((task) => !task.due_at).length} tasks have
                no due date
              </Text>
            </View>
            {!props.board.is_archived ? (
              <Action
                title="Add task"
                secondary
                onPress={() => props.onCreate(selected)}
              />
            ) : null}
          </View>
        </View>
      }
      ListEmptyComponent={
        <Empty
          title="Nothing due this day"
          message="Tasks appear on their due dates."
        />
      }
      renderItem={({ item }) => renderCard(item, props)}
    />
  );
}
function Timeline(props: ViewProps) {
  const [offset, setOffset] = useState(-7);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 41);
  const ordinal = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  return (
    <FlatList
      data={[...props.tasks].sort((a, b) =>
        (a.due_at ?? "z").localeCompare(b.due_at ?? "z"),
      )}
      keyExtractor={(task) => String(task.id)}
      contentContainerStyle={s.body}
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.refresh}
          tintColor={C.primary}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 14 }}>
          <Text style={s.hint}>
            From creation to due date · six-week window
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Chip
              label="← Earlier"
              onPress={() => setOffset((old) => old - 21)}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.hint, { textAlign: "center" }]}>
                {dateLabel(start.toISOString())} —{" "}
                {dateLabel(end.toISOString())}
              </Text>
            </View>
            <Chip
              label="Later →"
              onPress={() => setOffset((old) => old + 21)}
            />
          </View>
        </View>
      }
      ListEmptyComponent={<Empty title="No tasks match" />}
      renderItem={({ item: task }) => {
        const due =
          task.due_at && dayKey(task.due_at) ? new Date(task.due_at) : null;
        const createdAt = new Date(task.created_at);
        const created = due && due < createdAt ? due : createdAt;
        const origin = ordinal(start);
        const left = Math.min(
          100,
          Math.max(0, ((ordinal(created) - origin) / 42) * 100),
        );
        const right = due
          ? Math.min(100, Math.max(0, ((ordinal(due) - origin + 1) / 42) * 100))
          : left;
        const inWindow =
          due && ordinal(due) >= origin && ordinal(created) <= ordinal(end);
        const group = props.board.groups.find(
          (group) => group.id === task.group_id,
        );
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => props.onOpen(task.id)}
            style={s.card}
          >
            <Text style={{ color: C.ink, fontSize: 15, fontWeight: "500" }}>
              {task.title}
            </Text>
            <Text style={s.hint}>
              {group?.name ?? "Tasks"} · {dateLabel(task.due_at)}
            </Text>
            <View
              style={{ height: 10, borderRadius: 5, backgroundColor: C.line }}
            >
              {inWindow ? (
                <View
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${Math.max(1, right - left)}%`,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: task.completed_at ? C.green : C.primary,
                  }}
                />
              ) : null}
            </View>
            {!inWindow ? (
              <Text style={s.hint}>
                {due ? "Outside this window" : "Unscheduled"}
              </Text>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}
function Dashboard(props: ViewProps) {
  const filtered = { ...props.board, tasks: props.tasks };
  const stats = boardStats(filtered);
  return (
    <ScrollView
      contentContainerStyle={s.body}
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.refresh}
          tintColor={C.primary}
        />
      }
    >
      <View style={[s.card, { backgroundColor: C.primary }]}>
        <Text
          style={{ fontFamily: editorialFont, color: C.white, fontSize: 40 }}
        >
          {stats.progress}%
        </Text>
        <Text style={{ color: C.white }}>
          Complete · {stats.done} of {stats.total} tasks
        </Text>
        <Text style={{ color: C.white, opacity: 0.8, fontSize: 12 }}>
          {stats.open} open · {stats.overdue} overdue
        </Text>
      </View>
      {[
        [
          "By status",
          props.board.columns.map((column) => ({
            name: column.name,
            color: column.color ?? C.primary,
            count: props.tasks.filter((task) => task.column_id === column.id)
              .length,
          })),
        ],
        [
          "By priority",
          props.board.priority_labels.map((priority) => ({
            name: priority.name,
            color: priority.color,
            count: props.tasks.filter((task) => task.priority === priority.key)
              .length,
          })),
        ],
        [
          "By group",
          props.board.groups.map((group) => ({
            name: group.name,
            color: group.color ?? C.primary,
            count: props.tasks.filter((task) => task.group_id === group.id)
              .length,
          })),
        ],
      ].map(([title, rows]) => (
        <Section key={title as string} title={title as string}>
          {(rows as { name: string; color: string; count: number }[]).map(
            (row) => (
              <View key={row.name} style={s.card}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: C.ink }}>{row.name}</Text>
                  <Text style={{ color: C.moss }}>{row.count}</Text>
                </View>
                <View
                  style={{
                    height: 5,
                    backgroundColor: C.line,
                    borderRadius: 3,
                  }}
                >
                  <View
                    style={{
                      width: `${stats.total ? (row.count / stats.total) * 100 : 0}%`,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: row.color,
                    }}
                  />
                </View>
              </View>
            ),
          )}
        </Section>
      ))}
    </ScrollView>
  );
}
