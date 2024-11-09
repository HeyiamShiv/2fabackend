/*
  Warnings:

  - You are about to drop the column `user_id` on the `OTP` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OTP" DROP CONSTRAINT "OTP_user_id_fkey";

-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "user_id";
