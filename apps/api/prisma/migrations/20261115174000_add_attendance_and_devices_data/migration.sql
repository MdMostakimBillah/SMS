-- AlterTable
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "attendance_data" TEXT DEFAULT '{}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "devices_data" TEXT DEFAULT '{}';
