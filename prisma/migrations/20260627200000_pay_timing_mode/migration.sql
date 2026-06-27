-- CreateEnum
CREATE TYPE "PayTimingMode" AS ENUM ('PAY_IN_ARREARS', 'PERIOD_CLOSES_ON');

-- CreateEnum
CREATE TYPE "PeriodCloseMode" AS ENUM ('DAY_OF_MONTH', 'DAYS_BEFORE_PAYDAY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "payTimingMode" "PayTimingMode" NOT NULL DEFAULT 'PAY_IN_ARREARS';
ALTER TABLE "User" ADD COLUMN "periodCloseMode" "PeriodCloseMode" NOT NULL DEFAULT 'DAY_OF_MONTH';
ALTER TABLE "User" ADD COLUMN "periodCloseDayOfMonth" INTEGER NOT NULL DEFAULT 31;
ALTER TABLE "User" ADD COLUMN "periodCloseDaysBeforePayday" INTEGER NOT NULL DEFAULT 0;

-- Migrate from payInArrears
UPDATE "User"
SET "payTimingMode" = CASE
  WHEN "payInArrears" = true THEN 'PAY_IN_ARREARS'::"PayTimingMode"
  ELSE 'PERIOD_CLOSES_ON'::"PayTimingMode"
END;

UPDATE "User"
SET "periodCloseMode" = 'DAY_OF_MONTH',
    "periodCloseDayOfMonth" = 31
WHERE "payTimingMode" = 'PERIOD_CLOSES_ON';

ALTER TABLE "User" DROP COLUMN "payInArrears";
