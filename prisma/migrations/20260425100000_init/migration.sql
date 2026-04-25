-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ItemKind" AS ENUM ('SNIPPET', 'PROMPT', 'NOTE', 'COMMAND', 'FILE', 'IMAGE', 'LINK');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('TEXT', 'FILE', 'URL');

-- CreateEnum
CREATE TYPE "AiJobType" AS ENUM ('AUTO_TAG', 'SUMMARIZE', 'EXPLAIN_CODE', 'OPTIMIZE_PROMPT');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ItemKind" NOT NULL,
    "contentKind" "ContentKind" NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "sourceUrl" TEXT,
    "language" TEXT,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "originalFileName" TEXT,
    "fileSizeBytes" INTEGER,
    "metadata" JSONB,
    "aiSummary" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "lastViewedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "customTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "baseKind" "ItemKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "defaultKind" "ItemKind",
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "position" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","itemId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "AiJob" (
    "id" TEXT NOT NULL,
    "type" "AiJobType" NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT NOT NULL DEFAULT 'gpt-5.4-nano',
    "promptVersion" TEXT,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Item_userId_kind_idx" ON "Item"("userId", "kind");

-- CreateIndex
CREATE INDEX "Item_userId_updatedAt_idx" ON "Item"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Item_userId_lastViewedAt_idx" ON "Item"("userId", "lastViewedAt");

-- CreateIndex
CREATE INDEX "Item_customTypeId_idx" ON "Item"("customTypeId");

-- CreateIndex
CREATE INDEX "CustomType_userId_idx" ON "CustomType"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomType_userId_slug_key" ON "CustomType"("userId", "slug");

-- CreateIndex
CREATE INDEX "Collection_userId_updatedAt_idx" ON "Collection"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userId_slug_key" ON "Collection"("userId", "slug");

-- CreateIndex
CREATE INDEX "CollectionItem_itemId_idx" ON "CollectionItem"("itemId");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_slug_key" ON "Tag"("userId", "slug");

-- CreateIndex
CREATE INDEX "ItemTag_tagId_idx" ON "ItemTag"("tagId");

-- CreateIndex
CREATE INDEX "AiJob_userId_status_idx" ON "AiJob"("userId", "status");

-- CreateIndex
CREATE INDEX "AiJob_itemId_type_idx" ON "AiJob"("itemId", "type");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_customTypeId_fkey" FOREIGN KEY ("customTypeId") REFERENCES "CustomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomType" ADD CONSTRAINT "CustomType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
