import { Request, Response } from "express";
import prisma from "../config/client";
import { TryCatch } from "../utils/tryCatch";
import { getIO } from "../index";
import { sendNotification } from "../utils/socketNotification";
import { NotificationType } from "@prisma/client";

const createTask = TryCatch(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const { title, description, priority, dueDate, assignedToId } = req.body;

  if (!title || !assignedToId) {
    return res.status(400).json({ message: "Title and assignedToId required" });
  }

  const creator = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, role: true, orgId: true, name: true },
  });

  if (!creator) return res.status(401).json({ message: "User not found" });

  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
  });

  if (!assignee || assignee.orgId !== creator.orgId) {
    return res.status(400).json({ message: "Invalid assignee" });
  }

  // RBAC: Manager cannot assign to Admin
  if (creator.role === "MANAGER" && assignee.role !== "SALES") {
    return res.status(403).json({ message: "Managers can only assign tasks to SALES" });
  }

  // SALES cannot assign tasks at all
  if (creator.role === "SALES") {
    return res.status(403).json({ message: "Sales cannot assign tasks" });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedToId,
      createdById: creator.id,
      orgId: creator.orgId,
    },
  });

  // Send real-time notification to assignee
  if (assignedToId !== creator.id) {
    const io = getIO();
    await sendNotification(io, {
      userId: assignedToId,
      type: NotificationType.TASK_ASSIGNED,
      title: "New Task Assigned",
      message: `${creator.name} assigned you a new task: "${title}"`,
    });
  }

  res.status(201).json(task);
});

const getTasks = TryCatch(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, role: true, orgId: true },
  });

  if (!user) return res.status(401).json({ message: "User not found" });

  let tasks;

  if (user.role === "SALES") {
    tasks = await prisma.task.findMany({
      where: { assignedToId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } else {
    tasks = await prisma.task.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  res.json(tasks);
});

const updateTask = TryCatch(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const id = req.params.id as string;
  const { status, priority } = req.body;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user || user.orgId !== task.orgId) {
    return res.status(403).json({ message: "Access denied" });
  }

  // SALES can only update their own tasks
  if (user.role === "SALES" && task.assignedToId !== user.id) {
    return res.status(403).json({ message: "Cannot modify others' tasks" });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status, priority },
  });

  res.json(updated);
});

const deleteTask = TryCatch(async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  const id = req.params.id as string;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user || user.orgId !== task.orgId) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Only ADMIN and MANAGER can delete
  if (user.role === "SALES") {
    return res.status(403).json({ message: "Sales cannot delete tasks" });
  }

  await prisma.task.delete({ where: { id } });

  res.json({ message: "Task deleted successfully" });
});

export { createTask, getTasks, updateTask, deleteTask };