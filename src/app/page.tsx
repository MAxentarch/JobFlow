import prisma from "@/lib/prisma";
import TaskBoard, { type Task } from "./task-board";

// This page always shows live, frequently-changing data, so it should be
// generated fresh on every visit rather than pre-built once and reused.
// This also avoids the build process trying to reach the database, which
// isn't reachable from Railway's separate build machine.
export const dynamic = "force-dynamic";

export default async function Home() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, status: true },
  });

  // The database stores status as plain text; this tells TypeScript to
  // trust that it's always one of our three known values, since our own
  // code is the only thing that ever writes to it.
  return <TaskBoard initialTasks={tasks as Task[]} />;
}
