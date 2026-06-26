-- CreateSchema
CREATE TYPE "JobTitlePreset" AS ENUM ('FIELD_ENGINEER', 'OFFICE_DESK', 'CONSULTANT', 'FREELANCER');
CREATE TYPE "PeriodStatus" AS ENUM ('DRAFT', 'READY', 'SENT');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "employerName" TEXT,
    "employerEmail" TEXT,
    "ccSelfOnSubmit" BOOLEAN NOT NULL DEFAULT false,
    "submitMessage" TEXT,
    "activePreset" "JobTitlePreset" NOT NULL DEFAULT 'FIELD_ENGINEER',
    "activeUserTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserTimesheetTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "forkedFrom" "JobTitlePreset" NOT NULL,
    "fieldConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTimesheetTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimesheetPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "presetUsed" "JobTitlePreset",
    "userTemplateId" TEXT,
    "fieldConfigSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimesheetPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "mileage" DECIMAL(10,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "ccEmail" TEXT,
    "message" TEXT,
    "pdfStoragePath" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "UserTimesheetTemplate_userId_idx" ON "UserTimesheetTemplate"("userId");
CREATE UNIQUE INDEX "TimesheetPeriod_userId_startDate_key" ON "TimesheetPeriod"("userId", "startDate");
CREATE INDEX "TimesheetPeriod_userId_status_idx" ON "TimesheetPeriod"("userId", "status");
CREATE INDEX "TimeEntry_periodId_entryDate_idx" ON "TimeEntry"("periodId", "entryDate");
CREATE INDEX "Submission_periodId_idx" ON "Submission"("periodId");

ALTER TABLE "UserTimesheetTemplate" ADD CONSTRAINT "UserTimesheetTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimesheetPeriod" ADD CONSTRAINT "TimesheetPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TimesheetPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TimesheetPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
