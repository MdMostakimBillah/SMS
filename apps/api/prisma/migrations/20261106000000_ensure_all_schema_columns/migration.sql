-- AlterTable: add missing columns to schools
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "others_income_data" TEXT DEFAULT '{}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "hostel_data" TEXT DEFAULT '{}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "transport_data" TEXT DEFAULT '{}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "store_data" TEXT DEFAULT '{}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "fees_data" TEXT DEFAULT '{}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "classes_data" TEXT DEFAULT '[]';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "routines_data" TEXT DEFAULT '[]';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "banner" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "banner_position" TEXT DEFAULT '{"x":0,"y":0}';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "brand_name" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "brand_color" TEXT DEFAULT '#6366f1';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "motto" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "motto_bn" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "eiin" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "address_bn" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sessions" TEXT DEFAULT '["2025-26"]';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "breaks" TEXT DEFAULT '[]';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "storage_mode" TEXT DEFAULT 'cloud';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "server_url" TEXT DEFAULT '';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "folder_name" TEXT DEFAULT '';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'basic';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "max_students" INTEGER DEFAULT 500;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "max_teachers" INTEGER DEFAULT 50;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'paid';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "billing_cycle" TEXT DEFAULT 'monthly';

-- AlterTable: add missing columns to students
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "roll" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "academic_year" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "blood_group" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "religion" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "previous_school" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "present_address" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "permanent_address" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "father_name_bn" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "father_occupation" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "father_nid" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "mother_name_bn" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "mother_occupation" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "mother_nid" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "guardian_name" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "guardian_relation" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "guardian_phone" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "teacher_id" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "billing_date" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "approved_at" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "inactive_at" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "inactive_reason" TEXT;

-- CreateTable: notices
CREATE TABLE IF NOT EXISTS "notices" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT,
    "content" TEXT NOT NULL,
    "content_bn" TEXT,
    "author" TEXT,
    "author_bn" TEXT,
    "target" TEXT NOT NULL DEFAULT 'all',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'General',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "storage" TEXT,
    "local_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notice_categories
CREATE TABLE IF NOT EXISTS "notice_categories" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: media_objects
CREATE TABLE IF NOT EXISTS "media_objects" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_objects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notices_school_id_local_id_key" ON "notices"("school_id", "local_id");
CREATE INDEX IF NOT EXISTS "notices_school_id_idx" ON "notices"("school_id");
CREATE INDEX IF NOT EXISTS "notices_school_id_pinned_idx" ON "notices"("school_id", "pinned");
CREATE UNIQUE INDEX IF NOT EXISTS "notice_categories_name_school_id_key" ON "notice_categories"("name", "school_id");
CREATE INDEX IF NOT EXISTS "notice_categories_school_id_idx" ON "notice_categories"("school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "media_objects_object_key_key" ON "media_objects"("object_key");
CREATE INDEX IF NOT EXISTS "media_objects_school_id_idx" ON "media_objects"("school_id");
CREATE INDEX IF NOT EXISTS "media_objects_school_id_category_idx" ON "media_objects"("school_id", "category");
CREATE INDEX IF NOT EXISTS "media_objects_deleted_at_idx" ON "media_objects"("deleted_at");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_school_id_fkey') THEN
    ALTER TABLE "notices" ADD CONSTRAINT "notices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notice_categories_school_id_fkey') THEN
    ALTER TABLE "notice_categories" ADD CONSTRAINT "notice_categories_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_objects_school_id_fkey') THEN
    ALTER TABLE "media_objects" ADD CONSTRAINT "media_objects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
