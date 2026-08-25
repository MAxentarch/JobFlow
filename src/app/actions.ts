"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export type AddTaskState = {
  error: string | null;
};

export async function addTask(
  _prevState: AddTaskState,
  formData: FormData,
): Promise<AddTaskState> {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { error: "Please enter a task before adding it." };
  }

  await prisma.task.create({ data: { title } });

  // Tells Next.js the homepage's data is out of date, so it re-reads
  // the task list from the database next time it renders.
  revalidatePath("/");

  return { error: null };
}

export async function toggleTask(id: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;

  await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
  });
  revalidatePath("/");
}

export type TaskStatus = "active" | "pending" | "completed";

export async function setTaskStatus(id: number, status: TaskStatus) {
  await prisma.task.update({
    where: { id },
    // Keep the old on/off field in sync with the new status for now,
    // since some older code still reads it.
    data: { status, completed: status === "completed" },
  });
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  // deleteMany (rather than delete) simply does nothing if the task is
  // already gone, instead of throwing an error - e.g. if a double-click
  // sent two delete requests for the same task.
  await prisma.task.deleteMany({ where: { id } });
  revalidatePath("/");
}
