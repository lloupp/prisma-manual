// Testes de integridade de conteúdo técnico - ver AGENTS.md e a seção
// "Rastreabilidade" do prompt do projeto. Estas regras existem para impedir
// que uma especificação ou procedimento apareça ao usuário como fato
// confirmado sem uma fonte real por trás.
import { describe, it, expect } from 'vitest';
import { parts } from '../data/parts';
import { guides } from '../data/guides';
import { specifications } from '../data/specifications';
import { fluidSpecifications } from '../data/fluid-specifications';
import { maintenanceIntervals } from '../data/maintenance-intervals';
import { torqueSpecifications } from '../data/torque-specifications';
import { sources } from '../data/sources';
import { sourceReferences } from '../data/source-references';
import { Confidence } from '../types/enums';

const sourceIds = new Set(sources.map(s => s.id));

function referencesFor(subjectType: string, subjectId: string) {
  return sourceReferences.filter(r => r.subjectType === subjectType && r.subjectId === subjectId);
}

describe('Toda SourceReference aponta para uma Source real', () => {
  it('não tem referências órfãs (sourceId inexistente)', () => {
    const orphans = sourceReferences.filter(r => !sourceIds.has(r.sourceId));
    expect(orphans).toEqual([]);
  });
});

describe('Nenhuma especificação com confiança verificada fica sem fonte', () => {
  it.each([
    ['SPECIFICATION', specifications] as const,
    ['FLUID_SPECIFICATION', fluidSpecifications] as const,
    ['MAINTENANCE_INTERVAL', maintenanceIntervals] as const,
    ['TORQUE_SPECIFICATION', torqueSpecifications] as const,
    ['PART', parts] as const,
  ])('%s: toda linha com confidence != UNVERIFIED tem >= 1 SourceReference', (subjectType, rows) => {
    const missing = rows
      .filter(row => row.confidence !== Confidence.UNVERIFIED)
      .filter(row => referencesFor(subjectType, row.id).length === 0)
      .map(row => row.id);
    expect(missing).toEqual([]);
  });
});

describe('Nenhuma linha marcada OFFICIAL sem referência de confiança OFFICIAL', () => {
  it.each([
    ['SPECIFICATION', specifications] as const,
    ['FLUID_SPECIFICATION', fluidSpecifications] as const,
    ['MAINTENANCE_INTERVAL', maintenanceIntervals] as const,
    ['TORQUE_SPECIFICATION', torqueSpecifications] as const,
    ['PART', parts] as const,
  ])('%s: confidence OFFICIAL exige uma SourceReference também OFFICIAL', (subjectType, rows) => {
    const unsupported = rows
      .filter(row => row.confidence === Confidence.OFFICIAL)
      .filter(row => !referencesFor(subjectType, row.id).some(r => r.confidence === Confidence.OFFICIAL))
      .map(row => row.id);
    expect(unsupported).toEqual([]);
  });
});

describe('Torques de aperto nunca são inventados', () => {
  it('toda TorqueSpecification tem pelo menos uma fonte (a tabela pode ficar vazia, mas não pode ter linha sem fonte)', () => {
    const missing = torqueSpecifications.filter(t => referencesFor('TORQUE_SPECIFICATION', t.id).length === 0);
    expect(missing).toEqual([]);
  });
});

describe('Guias de reparo', () => {
  it('todo guia tem ao menos uma precaução de segurança', () => {
    const withoutPrecautions = guides.filter((g: any) => !Array.isArray(g.precautions) || g.precautions.length === 0).map((g: any) => g.id);
    expect(withoutPrecautions).toEqual([]);
  });

  it('todo guia referencia uma peça existente (partId válido)', () => {
    const partIds = new Set(parts.map(p => p.id));
    const orphanGuides = guides.filter((g: any) => !partIds.has(g.partId)).map((g: any) => g.id);
    expect(orphanGuides).toEqual([]);
  });

  it('todo guia tem passos numerados sequencialmente a partir de 1', () => {
    const broken = guides
      .filter((g: any) => {
        const numbers = g.steps.map((s: any) => s.stepNumber);
        return numbers.some((n: number, i: number) => n !== i + 1);
      })
      .map((g: any) => g.id);
    expect(broken).toEqual([]);
  });
});

describe('Peças', () => {
  it('toda peça referencia um sistema existente (systemId válido)', async () => {
    const { systems } = await import('../data/systems');
    const systemIds = new Set(systems.map(s => s.id));
    const orphanParts = parts.filter(p => !systemIds.has(p.systemId)).map(p => p.id);
    expect(orphanParts).toEqual([]);
  });

  it('toda peça tem um valor de confidence válido', () => {
    const invalid = parts.filter(p => !Object.values(Confidence).includes(p.confidence)).map(p => p.id);
    expect(invalid).toEqual([]);
  });
});
