-- AlterTable
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "notifications_data" TEXT DEFAULT '[]';
