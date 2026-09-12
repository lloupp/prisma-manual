-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "publicationYear" INTEGER,
    "url" TEXT,
    "file" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "page" TEXT,
    "section" TEXT,
    "confidence" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceReference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Specification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "system" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FluidSpecification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "system" TEXT NOT NULL,
    "fluidType" TEXT NOT NULL,
    "specGrade" TEXT,
    "capacity" TEXT,
    "checkInterval" TEXT,
    "changeInterval" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MaintenanceInterval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "intervalKm" INTEGER,
    "intervalMonths" INTEGER,
    "severeConditionKm" INTEGER,
    "severeConditionMonths" INTEGER,
    "notes" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TorqueSpecification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "system" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "fastener" TEXT NOT NULL,
    "valueNm" REAL,
    "valueKgfm" REAL,
    "condition" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "estimatedTimeMinutes" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "precautions" TEXT NOT NULL,
    "commonIssues" TEXT NOT NULL,
    "professionalHelp" TEXT NOT NULL,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010, câmbio manual 5 marchas',
    "confidence" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guide_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Guide" ("commonIssues", "createdAt", "description", "difficulty", "estimatedTime", "estimatedTimeMinutes", "id", "imageUrl", "partId", "precautions", "professionalHelp", "title", "updatedAt") SELECT "commonIssues", "createdAt", "description", "difficulty", "estimatedTime", "estimatedTimeMinutes", "id", "imageUrl", "partId", "precautions", "professionalHelp", "title", "updatedAt" FROM "Guide";
DROP TABLE "Guide";
ALTER TABLE "new_Guide" RENAME TO "Guide";
CREATE INDEX "Guide_partId_idx" ON "Guide"("partId");
CREATE TABLE "new_Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "oemNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "replacementInterval" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Part_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Part" ("brand", "createdAt", "description", "id", "name", "oemNumber", "partNumber", "position", "priceRange", "replacementInterval", "systemId", "updatedAt") SELECT "brand", "createdAt", "description", "id", "name", "oemNumber", "partNumber", "position", "priceRange", "replacementInterval", "systemId", "updatedAt" FROM "Part";
DROP TABLE "Part";
ALTER TABLE "new_Part" RENAME TO "Part";
CREATE INDEX "Part_systemId_idx" ON "Part"("systemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SourceReference_sourceId_idx" ON "SourceReference"("sourceId");

-- CreateIndex
CREATE INDEX "SourceReference_subjectType_subjectId_idx" ON "SourceReference"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "Specification_system_idx" ON "Specification"("system");

-- CreateIndex
CREATE INDEX "FluidSpecification_system_idx" ON "FluidSpecification"("system");

-- CreateIndex
CREATE INDEX "MaintenanceInterval_category_idx" ON "MaintenanceInterval"("category");

-- CreateIndex
CREATE INDEX "TorqueSpecification_system_idx" ON "TorqueSpecification"("system");
