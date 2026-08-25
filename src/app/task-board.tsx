"use client";

import { useActionState, useState } from "react";
import {
  addTask,
  deleteTask,
  setTaskStatus,
  type AddTaskState,
  type TaskStatus,
} from "./actions";

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

type Filter = "all" | TaskStatus;

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
];

// Visual styling for each status: a colored accent stripe + dot on the
// task row, plus the label shown in the dropdown.
const statusStyles: Record<TaskStatus, { label: string; border: string; dot: string }> = {
  active: {
    label: "Active",
    border: "border-l-green-500",
    dot: "bg-green-500",
  },
  pending: {
    label: "Pending",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    border: "border-l-red-500",
    dot: "bg-red-500",
  },
};

const initialActionState: AddTaskState = { error: null };

function emptyStateMessage(filter: Filter, totalCount: number) {
  if (totalCount === 0) return "No tasks yet — add one above to get started.";
  if (filter === "active") return "Nothing active — nice work!";
  if (filter === "pending") return "No pending tasks.";
  if (filter === "completed") return "No completed tasks yet.";
  return "No tasks here.";
}

export default function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [state, formAction, addPending] = useActionState(
    addTask,
    initialActionState,
  );

  // The database is the source of truth. Whenever the server sends a new
  // `initialTasks` list (e.g. right after successfully adding a task),
  // replace what's on screen with it before this render is shown.
  const [syncedTasks, setSyncedTasks] = useState(initialTasks);
  if (initialTasks !== syncedTasks) {
    setSyncedTasks(initialTasks);
    setTasks(initialTasks);
  }

  const visibleTasks = tasks.filter(
    (task) => filter === "all" || task.status === filter,
  );

  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const progressPercent =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  async function handleStatusChange(id: number, status: TaskStatus) {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await setTaskStatus(id, status);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id: number) {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await deleteTask(id);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              JobFlow
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              A simple way to keep track of what needs doing.
            </p>
          </header>

          <form action={formAction} className="mb-1 flex gap-2">
            <input
              type="text"
              name="title"
              placeholder="Add a new task..."
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-shadow focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
            />
            <button
              type="submit"
              disabled={addPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {addPending ? "Adding..." : "Add"}
            </button>
          </form>
          <p
            aria-live="polite"
            className="mb-2 min-h-[1.25rem] text-sm text-red-600 dark:text-red-400"
          >
            {state.error}
          </p>

          <div className="mb-4">
            <p className="mb-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {completedCount} of {tasks.length} tasks completed
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visibleTasks.map((task) => {
              const isPending = pendingIds.has(task.id);
              const styles = statusStyles[task.status];
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 border-l-4 py-3 pl-3 transition-opacity ${styles.border} ${
                    isPending ? "opacity-50" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.status === "completed"
                        ? "text-zinc-400 line-through dark:text-zinc-600"
                        : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {task.title}
                  </span>
                  <select
                    value={task.status}
                    disabled={isPending}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    aria-label={`Status for "${task.title}"`}
                    className="shrink-0 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(task.id)}
                    aria-label={`Delete "${task.title}"`}
                    className="shrink-0 text-sm text-zinc-400 transition-colors hover:text-red-600 disabled:pointer-events-none dark:text-zinc-500 dark:hover:text-red-400"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
            {visibleTasks.length === 0 && (
              <li className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-600">
                {emptyStateMessage(filter, tasks.length)}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
