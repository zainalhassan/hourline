-- AlterTable
ALTER TABLE "User" ADD COLUMN "payInArrears" BOOLEAN NOT NULL DEFAULT false;

-- Monthly and fortnightly payroll is usually in arrears
UPDATE "User" SET "payInArrears" = true WHERE "payPeriodType" IN ('MONTHLY', 'FORTNIGHTLY');
