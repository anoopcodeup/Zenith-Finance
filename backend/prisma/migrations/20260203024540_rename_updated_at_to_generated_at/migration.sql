/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `monthly_user_summary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "monthly_user_summary" DROP COLUMN "updatedAt",
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
