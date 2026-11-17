import type { PrismaClient } from '@prisma/client'

/**
 * Ensures all required database columns and tables exist in PostgreSQL.
 *
 * Runs idempotently on server startup using `ADD COLUMN IF NOT EXISTS`.
 * This prevents fatal Prisma P2022 errors ("column does not exist") if migrations
 * were skipped or schema changes were pushed ahead of manual migrations.
 */
export async function ensureDatabaseSchema(prisma: PrismaClient): Promise<void> {
  try {
    // 1. Ensure all columns on schools table exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- School domain fields
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "online_data" TEXT DEFAULT '[]';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "syllabus_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "assignments_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "attendance_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "devices_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "library_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "exams_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "hr_data" TEXT DEFAULT '{}';
        ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "expenses_data" TEXT DEFAULT '{}';
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
      END $$;

      -- Better Auth schema & tables for Google OAuth & social authentication
      CREATE SCHEMA IF NOT EXISTS neon_auth;

      CREATE TABLE IF NOT EXISTS neon_auth.user (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        role TEXT,
        banned BOOLEAN DEFAULT false,
        "banReason" TEXT,
        "banExpires" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS neon_auth.session (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
        "activeOrganizationId" UUID
      );

      CREATE TABLE IF NOT EXISTS neon_auth.account (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS neon_auth.verification (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('[schema] Database schema verified successfully.')
  } catch (err) {
    console.warn('[schema] Warning: Could not run automated schema verification:', err instanceof Error ? err.message : err)
  }
}
