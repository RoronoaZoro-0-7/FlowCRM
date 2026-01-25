/*
  Warnings:

  - You are about to drop the column `completed` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `dueAt` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `assignedToId` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgId` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_leadId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_userId_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "completed",
DROP COLUMN "dueAt",
DROP COLUMN "userId",
ADD COLUMN     "assignedToId" TEXT NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "orgId" TEXT NOT NULL,
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "leadId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
