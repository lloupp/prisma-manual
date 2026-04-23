-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "System" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "System_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Part_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guide" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guide_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guideId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tips" TEXT NOT NULL,
    "warnings" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GuideStep_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "viewType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cameraPositionX" REAL NOT NULL,
    "cameraPositionY" REAL NOT NULL,
    "cameraPositionZ" REAL NOT NULL,
    "cameraTargetX" REAL NOT NULL,
    "cameraTargetY" REAL NOT NULL,
    "cameraTargetZ" REAL NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarView_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hotspot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    CONSTRAINT "Hotspot_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "CarView" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
