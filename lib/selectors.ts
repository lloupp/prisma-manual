// selectors.ts
// Acesso a dados via Prisma/SQLite com fallback pontual para metadados estáticos

import { getPrisma } from './prisma';
import { vehicle as staticVehicle } from '../data/vehicle';
import { parts as staticParts } from '../data/parts';
import { guides as staticGuides } from '../data/guides';

const staticPartsById = new Map(staticParts.map((part) => [part.id, part]));
const staticGuidesById = new Map(staticGuides.map((guide) => [guide.id, guide]));

// Funções utilitárias para converter dados do banco
function parseSystem(system: any) {
  return {
    id: system.id,
    name: system.name,
    categoryType: system.categoryType,
    description: system.description,
    vehicleId: system.vehicleId,
  };
}

function parsePart(part: any) {
  const staticPart = staticPartsById.get(part.id);

  return {
    id: part.id,
    systemId: part.systemId,
    name: part.name,
    partNumber: part.partNumber,
    oemNumber: part.oemNumber,
    brand: part.brand,
    position: part.position,
    description: part.description,
    symptoms: staticPart?.symptoms ?? [],
    guideIds: staticPart?.guideIds ?? [],
    replacementInterval: part.replacementInterval,
    priceRange: part.priceRange,
  };
}

function parseGuide(guide: any) {
  const staticGuide = staticGuidesById.get(guide.id);

  return {
    id: guide.id,
    partId: guide.partId,
    title: guide.title,
    description: guide.description,
    difficulty: guide.difficulty,
    estimatedTime: guide.estimatedTime,
    estimatedTimeMinutes: guide.estimatedTimeMinutes,
    imageUrl: guide.imageUrl,
    tools: staticGuide?.tools ?? [],
    materials: staticGuide?.materials ?? [],
    precautions: JSON.parse(guide.precautions || '[]'),
    commonIssues: JSON.parse(guide.commonIssues || '[]'),
    professionalHelp: guide.professionalHelp,
  };
}

function parseGuideStep(step: any) {
  return {
    id: step.id,
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    imageUrl: step.imageUrl,
    tips: JSON.parse(step.tips || '[]'),
    warnings: JSON.parse(step.warnings || '[]'),
  };
}

function parseView(view: any) {
  return {
    id: view.id,
    name: view.name,
    viewType: view.viewType,
    description: view.description,
    cameraPosition: {
      x: view.cameraPositionX,
      y: view.cameraPositionY,
      z: view.cameraPositionZ,
    },
    cameraTarget: {
      x: view.cameraTargetX,
      y: view.cameraTargetY,
      z: view.cameraTargetZ,
    },
    thumbnailUrl: view.thumbnailUrl,
  };
}

function parseHotspot(hotspot: any) {
  return {
    id: hotspot.id,
    view: hotspot.viewId,
    area: hotspot.area,
    x: hotspot.x,
    y: hotspot.y,
  };
}

// Funções selector para buscar entidades e listas

export async function getVehicle() {
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findFirst();
  if (!vehicle) return null;
  return {
    id: vehicle.id,
    brand: staticVehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    modelYear: vehicle.year,
    engine: vehicle.engine,
    engineDisplacement: staticVehicle.engineDisplacement,
    fuelType: vehicle.fuelType,
    transmission: staticVehicle.transmission,
    version: staticVehicle.version,
    vin: staticVehicle.vin,
    plate: staticVehicle.plate,
    mileage: staticVehicle.mileage,
    color: staticVehicle.color,
  };
}

export async function getViews() {
  const prisma = getPrisma();
  const views = await prisma.carView.findMany();
  return views.map(parseView);
}

export async function getSystems() {
  const prisma = getPrisma();
  const systems = await prisma.system.findMany({ include: { parts: true } });
  return systems.map(s => ({
    ...parseSystem(s),
    partIds: s.parts.map(p => p.id),
    _count: { parts: s.parts.length },
  }));
}

export async function getParts() {
  const prisma = getPrisma();
  const parts = await prisma.part.findMany();
  return parts.map(parsePart);
}

export async function getGuides() {
  const prisma = getPrisma();
  const guides = await prisma.guide.findMany();
  return guides.map(parseGuide);
}

export async function getHotspots() {
  const prisma = getPrisma();
  const hotspots = await prisma.hotspot.findMany();
  return hotspots.map(parseHotspot);
}

export async function getAreaById(id: string) {
  // Áreas são estáticas (mock)
  const { areas } = await import('../data/areas');
  return areas.find((a) => a.id === id);
}

export async function getSystemById(id: string) {
  const prisma = getPrisma();
  const system = await prisma.system.findUnique({
    where: { id },
    include: { parts: true },
  });
  if (!system) return null;
  return {
    ...parseSystem(system),
    partIds: system.parts.map(p => p.id),
  };
}

export async function getPartById(id: string) {
  const prisma = getPrisma();
  const part = await prisma.part.findUnique({ where: { id } });
  return part ? parsePart(part) : null;
}

export async function getGuideById(id: string) {
  const prisma = getPrisma();
  const guide = await prisma.guide.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
  });
  if (!guide) return null;
  return {
    ...parseGuide(guide),
    steps: guide.steps.map(parseGuideStep),
  };
}

export async function getPartsBySystemId(systemId: string) {
  const prisma = getPrisma();
  const parts = await prisma.part.findMany({ where: { systemId } });
  return parts.map(parsePart);
}

export async function getGuidesByPartId(partId: string) {
  const prisma = getPrisma();
  const guides = await prisma.guide.findMany({ where: { partId } });
  return guides.map(parseGuide);
}

export async function getHotspotsByViewId(viewId: string) {
  const prisma = getPrisma();
  const hotspots = await prisma.hotspot.findMany({ where: { viewId } });
  return hotspots.map(parseHotspot);
}
