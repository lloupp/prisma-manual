// selectors.ts
// Acesso a dados via Prisma/SQLite com fallback pontual para metadados estáticos

import { cache } from 'react';
import { getPrisma } from './prisma';
import { vehicle as staticVehicle } from '../data/vehicle';
import { parts as staticParts } from '../data/parts';
import { guides as staticGuides } from '../data/guides';

const staticPartsById = new Map(staticParts.map((part) => [part.id, part]));
const staticGuidesById = new Map(staticGuides.map((guide) => [guide.id, guide]));

function safeParseArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const s = String(value).trim();
  if (!s || s === 'null') return [];
  if (s.startsWith('[')) {
    try { return JSON.parse(s); } catch { /* fall through */ }
  }
  return [s];
}

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
    confidence: part.confidence,
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
    precautions: safeParseArray(guide.precautions),
    commonIssues: safeParseArray(guide.commonIssues),
    professionalHelp: guide.professionalHelp,
    applicability: guide.applicability,
    confidence: guide.confidence,
  };
}

function parseGuideStep(step: any) {
  return {
    id: step.id,
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    imageUrl: step.imageUrl,
    tips: safeParseArray(step.tips),
    warnings: safeParseArray(step.warnings),
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

// cache() dedupes repeated calls with the same id within a single request,
// since both generateMetadata and the page component look up the same entity.
export const getSystemById = cache(async (id: string) => {
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
});

export const getPartById = cache(async (id: string) => {
  const prisma = getPrisma();
  const part = await prisma.part.findUnique({ where: { id } });
  return part ? parsePart(part) : null;
});

export const getGuideById = cache(async (id: string) => {
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
});

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

// ── Especificações técnicas rastreáveis ──────────────────────────────────

export async function getSpecifications() {
  const prisma = getPrisma();
  return prisma.specification.findMany({ orderBy: { system: 'asc' } });
}

export async function getFluidSpecifications() {
  const prisma = getPrisma();
  return prisma.fluidSpecification.findMany({ orderBy: { system: 'asc' } });
}

export async function getMaintenanceIntervals() {
  const prisma = getPrisma();
  return prisma.maintenanceInterval.findMany({ orderBy: [{ category: 'asc' }, { intervalKm: 'asc' }] });
}

export async function getTorqueSpecifications() {
  const prisma = getPrisma();
  return prisma.torqueSpecification.findMany({ orderBy: { system: 'asc' } });
}

function parseSourceReference(ref: any) {
  return {
    id: ref.id,
    subjectId: ref.subjectId,
    confidence: ref.confidence,
    page: ref.page,
    section: ref.section,
    notes: ref.notes,
    source: {
      id: ref.source.id,
      title: ref.source.title,
      publisher: ref.source.publisher,
      documentType: ref.source.documentType,
      publicationYear: ref.source.publicationYear,
      url: ref.source.url,
    },
  };
}

/**
 * Fontes que sustentam uma afirmação específica (peça, guia, especificação...).
 * Usado pela UI para exibir a citação e o nível de confiança de cada dado.
 */
export const getSourceReferences = cache(async (subjectType: string, subjectId: string) => {
  const prisma = getPrisma();
  const refs = await prisma.sourceReference.findMany({
    where: { subjectType, subjectId },
    include: { source: true },
  });
  return refs.map(parseSourceReference);
});

/**
 * Todas as SourceReference de um tipo, agrupadas por subjectId. Evita N+1
 * consultas em páginas que listam muitas especificações de uma vez.
 */
export const getSourceReferencesByType = cache(async (subjectType: string) => {
  const prisma = getPrisma();
  const refs = await prisma.sourceReference.findMany({
    where: { subjectType },
    include: { source: true },
  });
  const bySubjectId = new Map<string, ReturnType<typeof parseSourceReference>[]>();
  for (const ref of refs) {
    const parsed = parseSourceReference(ref);
    const list = bySubjectId.get(parsed.subjectId) ?? [];
    list.push(parsed);
    bySubjectId.set(parsed.subjectId, list);
  }
  return bySubjectId;
});

// ── Prontuário do veículo (sessões de diagnóstico OBD) ───────────────────

export interface CreateDiagnosticSessionInput {
  id: string;
  startedAt: string;
  endedAt?: string;
  port: string;
  protocol?: string;
  ecuResponded: boolean;
  supportedPids: string[];
  dtcs: Array<{ code: string; description: string | null }>;
  freezeFrame?: Record<string, unknown> | null;
  finalSamples?: Record<string, unknown> | null;
  symptomsReported?: string;
  /** Amostras rotuladas por regime (idle, higher_rpm...) usadas pelo motor
   * de hipóteses - só presentes quando a sessão veio do fluxo de
   * Diagnóstico, não do Scanner simples. */
  diagnosticSamples?: unknown[] | null;
  /** Testes guiados que o usuário reportou ter executado, com o resultado. */
  reportedTests?: unknown[] | null;
  /** O DiagnosticReport (hipóteses) no momento em que a sessão foi salva -
   * permite reabrir a sessão depois mostrando exatamente o que foi visto,
   * sem depender de recalcular com as mesmas regras. */
  hypothesesSnapshot?: Record<string, unknown> | null;
}

export async function createDiagnosticSession(input: CreateDiagnosticSessionInput) {
  const prisma = getPrisma();
  return prisma.diagnosticSession.create({
    data: {
      id: input.id,
      startedAt: new Date(input.startedAt),
      endedAt: input.endedAt ? new Date(input.endedAt) : new Date(),
      port: input.port,
      protocol: input.protocol,
      ecuResponded: input.ecuResponded,
      supportedPids: JSON.stringify(input.supportedPids),
      dtcs: JSON.stringify(input.dtcs),
      freezeFrame: input.freezeFrame ? JSON.stringify(input.freezeFrame) : null,
      finalSamples: input.finalSamples ? JSON.stringify(input.finalSamples) : null,
      symptomsReported: input.symptomsReported,
      diagnosticSamples: input.diagnosticSamples ? JSON.stringify(input.diagnosticSamples) : null,
      reportedTests: input.reportedTests ? JSON.stringify(input.reportedTests) : null,
      hypothesesSnapshot: input.hypothesesSnapshot ? JSON.stringify(input.hypothesesSnapshot) : null,
    },
  });
}

function parseDiagnosticSession(session: any) {
  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    port: session.port,
    protocol: session.protocol,
    ecuResponded: session.ecuResponded,
    supportedPids: safeParseArray(session.supportedPids),
    dtcs: session.dtcs ? JSON.parse(session.dtcs) : [],
    freezeFrame: session.freezeFrame ? JSON.parse(session.freezeFrame) : null,
    finalSamples: session.finalSamples ? JSON.parse(session.finalSamples) : null,
    symptomsReported: session.symptomsReported,
    diagnosticSamples: session.diagnosticSamples ? JSON.parse(session.diagnosticSamples) : null,
    reportedTests: session.reportedTests ? JSON.parse(session.reportedTests) : null,
    hypothesesSnapshot: session.hypothesesSnapshot ? JSON.parse(session.hypothesesSnapshot) : null,
    notes: session.notes,
  };
}

export async function getDiagnosticSessions(limit = 50) {
  const prisma = getPrisma();
  const sessions = await prisma.diagnosticSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
  return sessions.map(parseDiagnosticSession);
}

export const getDiagnosticSessionById = cache(async (id: string) => {
  const prisma = getPrisma();
  const session = await prisma.diagnosticSession.findUnique({ where: { id } });
  return session ? parseDiagnosticSession(session) : null;
});
