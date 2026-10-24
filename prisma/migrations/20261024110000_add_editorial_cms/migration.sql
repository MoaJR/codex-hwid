CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ArticleBlockType" AS ENUM ('PARAGRAPH', 'HEADING', 'LIST');

ALTER TABLE "AuditEvent" ADD COLUMN "resourceType" TEXT;
ALTER TABLE "AuditEvent" ADD COLUMN "resourceId" UUID;
CREATE INDEX "AuditEvent_resourceType_resourceId_occurredAt_idx" ON "AuditEvent"("resourceType", "resourceId", "occurredAt");

CREATE TABLE "Article" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "readingMinutes" INTEGER NOT NULL,
  "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
  "editorialLabel" TEXT NOT NULL,
  "reviewNotice" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdById" UUID,
  "updatedById" UUID,
  "reviewedById" UUID,
  "publishedById" UUID,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Article_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Article_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT "Article_reading_minutes_check" CHECK ("readingMinutes" BETWEEN 1 AND 60),
  CONSTRAINT "Article_version_check" CHECK ("version" >= 1),
  CONSTRAINT "Article_published_at_check" CHECK ("status" <> 'PUBLISHED' OR "publishedAt" IS NOT NULL)
);

CREATE TABLE "ArticleBlock" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "articleId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "type" "ArticleBlockType" NOT NULL,
  "text" TEXT,
  "items" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "ArticleBlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArticleBlock_position_check" CHECK ("position" >= 0),
  CONSTRAINT "ArticleBlock_content_check" CHECK (
    ("type" = 'LIST' AND "text" IS NULL AND cardinality("items") > 0)
    OR
    ("type" IN ('PARAGRAPH', 'HEADING') AND "text" IS NOT NULL AND length(btrim("text")) > 0 AND cardinality("items") = 0)
  )
);

CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_category_status_publishedAt_idx" ON "Article"("category", "status", "publishedAt");
CREATE UNIQUE INDEX "ArticleBlock_articleId_position_key" ON "ArticleBlock"("articleId", "position");
CREATE INDEX "ArticleBlock_articleId_idx" ON "ArticleBlock"("articleId");

ALTER TABLE "Article" ADD CONSTRAINT "Article_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleBlock" ADD CONSTRAINT "ArticleBlock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
