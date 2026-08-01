-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'X', 'WHATSAPP');

-- CreateTable
CREATE TABLE "SocialMediaLink" (
    "id" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaLink_platform_key" ON "SocialMediaLink"("platform");
