-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('OFFICIAL', 'OEM', 'CROSS_VERIFIED', 'UNVERIFIED');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "oemNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "replacementInterval" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "confidence" "Confidence" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
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
    "confidence" "Confidence" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tips" TEXT NOT NULL,
    "warnings" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarView" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "viewType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cameraPositionX" DOUBLE PRECISION NOT NULL,
    "cameraPositionY" DOUBLE PRECISION NOT NULL,
    "cameraPositionZ" DOUBLE PRECISION NOT NULL,
    "cameraTargetX" DOUBLE PRECISION NOT NULL,
    "cameraTargetY" DOUBLE PRECISION NOT NULL,
    "cameraTargetZ" DOUBLE PRECISION NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotspot" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Hotspot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "publicationYear" INTEGER,
    "url" TEXT,
    "file" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceReference" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "page" TEXT,
    "section" TEXT,
    "confidence" "Confidence" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specification" (
    "id" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" "Confidence" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluidSpecification" (
    "id" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "fluidType" TEXT NOT NULL,
    "specGrade" TEXT,
    "capacity" TEXT,
    "checkInterval" TEXT,
    "changeInterval" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" "Confidence" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FluidSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceInterval" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "intervalKm" INTEGER,
    "intervalMonths" INTEGER,
    "severeConditionKm" INTEGER,
    "severeConditionMonths" INTEGER,
    "notes" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" "Confidence" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TorqueSpecification" (
    "id" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "fastener" TEXT NOT NULL,
    "valueNm" DOUBLE PRECISION,
    "valueKgfm" DOUBLE PRECISION,
    "condition" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010',
    "confidence" "Confidence" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TorqueSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "port" TEXT NOT NULL,
    "protocol" TEXT,
    "ecuResponded" BOOLEAN NOT NULL DEFAULT false,
    "supportedPids" TEXT NOT NULL,
    "dtcs" TEXT NOT NULL,
    "freezeFrame" TEXT,
    "finalSamples" TEXT,
    "symptomsReported" TEXT,
    "diagnosticSamples" TEXT,
    "reportedTests" TEXT,
    "hypothesesSnapshot" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Part_systemId_idx" ON "Part"("systemId");

-- CreateIndex
CREATE INDEX "Guide_partId_idx" ON "Guide"("partId");

-- CreateIndex
CREATE INDEX "GuideStep_guideId_idx" ON "GuideStep"("guideId");

-- CreateIndex
CREATE INDEX "Hotspot_viewId_idx" ON "Hotspot"("viewId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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

-- CreateIndex
CREATE INDEX "DiagnosticSession_startedAt_idx" ON "DiagnosticSession"("startedAt");

-- AddForeignKey
ALTER TABLE "System" ADD CONSTRAINT "System_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarView" ADD CONSTRAINT "CarView_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotspot" ADD CONSTRAINT "Hotspot_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "CarView"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceReference" ADD CONSTRAINT "SourceReference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

