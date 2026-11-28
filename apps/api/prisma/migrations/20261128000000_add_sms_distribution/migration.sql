-- AlterTable
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sms_allocated" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sms_used" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "sms_balance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "sms_purchases" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "ref_id" TEXT NOT NULL,
    "notes" TEXT,
    "purchased_by" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sms_allocations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'credit',
    "note" TEXT,
    "allocated_by" TEXT,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sms_dispatch_logs" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "school_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL DEFAULT 'manual',
    "provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "segments" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "provider_response" TEXT,
    "error" TEXT,
    "sent_by" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sms_purchases_purchased_at_idx" ON "sms_purchases"("purchased_at");
CREATE INDEX IF NOT EXISTS "sms_allocations_school_id_idx" ON "sms_allocations"("school_id");
CREATE INDEX IF NOT EXISTS "sms_allocations_allocated_at_idx" ON "sms_allocations"("allocated_at");
CREATE INDEX IF NOT EXISTS "sms_dispatch_logs_school_id_idx" ON "sms_dispatch_logs"("school_id");
CREATE INDEX IF NOT EXISTS "sms_dispatch_logs_sent_at_idx" ON "sms_dispatch_logs"("sent_at");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sms_allocations_school_id_fkey') THEN
    ALTER TABLE "sms_allocations" ADD CONSTRAINT "sms_allocations_school_id_fkey"
      FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sms_dispatch_logs_school_id_fkey') THEN
    ALTER TABLE "sms_dispatch_logs" ADD CONSTRAINT "sms_dispatch_logs_school_id_fkey"
      FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
