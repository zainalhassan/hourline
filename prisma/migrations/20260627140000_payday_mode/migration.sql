-- CreateEnum
CREATE TYPE "PaydayMode" AS ENUM ('DAY_OF_MONTH', 'LAST_WEEKDAY_OF_MONTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "paydayMode" "PaydayMode" NOT NULL DEFAULT 'DAY_OF_MONTH';
