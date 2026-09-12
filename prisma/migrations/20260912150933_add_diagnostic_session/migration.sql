-- CreateTable
CREATE TABLE "DiagnosticSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "port" TEXT NOT NULL,
    "protocol" TEXT,
    "ecuResponded" BOOLEAN NOT NULL DEFAULT false,
    "supportedPids" TEXT NOT NULL,
    "dtcs" TEXT NOT NULL,
    "freezeFrame" TEXT,
    "finalSamples" TEXT,
    "symptomsReported" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "DiagnosticSession_startedAt_idx" ON "DiagnosticSession"("startedAt");
