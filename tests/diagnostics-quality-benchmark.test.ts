// Benchmark de qualidade diagnóstica - os cenários explicitamente pedidos
// para validar o motor de hipóteses (lib/diagnostics), rodados através de
// runDiagnostics() de ponta a ponta (não regra por regra) para exercitar o
// sistema como um todo. Cada teste aqui corresponde a um dos critérios de
// qualidade exigidos: nunca certeza prematura, reconhecer dado ausente,
// propor um próximo teste coerente, nunca inventar especificação, nunca
// recomendar troca de peça sem evidência.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runDiagnostics } from '../lib/diagnostics/engine';
import { DiagnosticCase, DiagnosticSample } from '../lib/diagnostics/types';

function sample(label: DiagnosticSample['label'], pids: DiagnosticSample['pids']): DiagnosticSample {
  return { label, takenAt: new Date().toISOString(), pids };
}

function emptyCase(overrides: Partial<DiagnosticCase> = {}): DiagnosticCase {
  return { symptom: 'teste', dtcs: [], samples: [], reportedTests: [], ...overrides };
}

const NEVER_RECOMMEND_PART_SWAP = /troque (a|o) (peça|vela|bobina|bateria|sensor|alternador|bomba)/i;
// Uma nota que afirma ser especificação confirmada do Prisma SEM a negação
// "não é" logo antes seria uma alegação indevida - a heurística nunca deve
// se passar por um dado do veículo real sem esse desmentido explícito.
const CLAIMS_PRISMA_SPEC_WITHOUT_DISCLAIMER = /(?<!não é uma )especifica[çc][ãa]o (confirmada|oficial) do (chevrolet )?prisma/i;

describe('Benchmark: mistura pobre em marcha lenta que melhora em rotação maior', () => {
  const input = emptyCase({
    symptom: 'Motor engasga em marcha lenta',
    samples: [
      sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 15, unit: '%' },
        STFT_B1: { status: 'OK', value: 6, unit: '%' },
      }),
      sample('higher_rpm', {
        RPM: { status: 'OK', value: 2500, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 2, unit: '%' },
        STFT_B1: { status: 'OK', value: 1, unit: '%' },
      }),
    ],
  });
  const report = runDiagnostics(input);
  const top = report.hypotheses[0];

  it('identifica a hipótese de mistura pobre como a mais provável', () => {
    expect(top.description).toMatch(/mistura pobre/i);
  });

  it('reconhece a melhora em rotação mais alta como evidência forte (assinatura de vazamento de vácuo)', () => {
    expect(top.evidenceFor.some(e => e.strength === 'strong')).toBe(true);
  });

  it('mesmo com evidência forte, não ultrapassa o teto de certeza sem teste confirmado', () => {
    expect(top.confidence).toBeLessThanOrEqual(0.65);
  });

  it('recomenda um próximo teste barato e seguro, nunca troca de peça direta', () => {
    expect(top.nextTest).not.toBeNull();
    expect(top.nextTest!.cost).toBe('low');
    expect(top.nextTest!.safety).toBe('safe');
    expect(top.description).not.toMatch(NEVER_RECOMMEND_PART_SWAP);
  });
});

describe('Benchmark: trims elevados sem melhora em diferentes regimes', () => {
  const input = emptyCase({
    symptom: 'Consumo alto e marcha lenta irregular',
    samples: [
      sample('idle', {
        RPM: { status: 'OK', value: 820, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 14, unit: '%' },
        STFT_B1: { status: 'OK', value: 5, unit: '%' },
      }),
      sample('higher_rpm', {
        RPM: { status: 'OK', value: 2400, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 13, unit: '%' },
        STFT_B1: { status: 'OK', value: 5, unit: '%' },
      }),
    ],
  });
  const report = runDiagnostics(input);
  const top = report.hypotheses.find(h => h.description.match(/mistura pobre/i));

  it('reconhece que o trim não melhora em rotação mais alta como evidência contra vazamento de vácuo simples', () => {
    expect(top).toBeDefined();
    expect(top!.evidenceAgainst.length).toBeGreaterThan(0);
  });

  it('ainda assim não descarta a hipótese - sugere investigar causas que afetam qualquer regime', () => {
    expect(top!.evidenceAgainst[0].description).toMatch(/qualquer regime|MAF|pressão de combustível|injetor/i);
  });
});

describe('Benchmark: misfire sem dados suficientes', () => {
  const input = emptyCase({
    symptom: 'Motor falha ao acelerar',
    dtcs: [{ code: 'P0301', description: 'Falha de ignição detectada no cilindro 1' }],
  });
  const report = runDiagnostics(input);
  const top = report.hypotheses[0];

  it('gera a hipótese de falha de ignição, mas com confiança baixa', () => {
    expect(top.description).toMatch(/falha de igni[çc][ãa]o/i);
    expect(top.confidence).toBeLessThan(0.5);
  });

  it('lista dados ausentes em vez de concluir qual peça trocar', () => {
    expect(top.missingData.length).toBeGreaterThan(0);
  });

  it('recomenda coletar fuel trims/freeze frame antes de qualquer teste de troca de peça', () => {
    expect(top.nextTest!.id).toBe('test-fuel-trims-and-freeze-frame');
  });

  it('nunca afirma qual componente substituir', () => {
    expect(top.description).not.toMatch(NEVER_RECOMMEND_PART_SWAP);
    expect(top.heuristicNote ?? '').not.toMatch(NEVER_RECOMMEND_PART_SWAP);
  });
});

describe('Benchmark: tensão baixa com motor funcionando', () => {
  const input = emptyCase({
    symptom: 'Luzes do painel piscando com o carro ligado',
    samples: [sample('idle', {
      RPM: { status: 'OK', value: 850, unit: 'rpm' },
      CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 11.9, unit: 'V' },
    })],
  });
  const report = runDiagnostics(input);
  const top = report.hypotheses[0];

  it('identifica possível falha do sistema de carga', () => {
    expect(top.description).toMatch(/sistema de carga/i);
  });

  it('distingue explicitamente de uma bateria fraca com o motor desligado (dado ausente aponta a diferença)', () => {
    expect(top.missingData.some(m => /rota[çc][ãa]o mais alta/i.test(m))).toBe(true);
  });

  it('o heuristicNote deixa claro que o limiar é genérico, não uma especificação do Prisma', () => {
    expect(top.heuristicNote).toBeDefined();
    expect(top.heuristicNote).toMatch(/genérica/i);
    expect(top.heuristicNote).not.toMatch(CLAIMS_PRISMA_SPEC_WITHOUT_DISCLAIMER);
  });
});

describe('Benchmark: sensor retornando valor incoerente', () => {
  const input = emptyCase({
    symptom: 'Ventoinha nunca liga',
    samples: [sample('idle', {
      RPM: { status: 'OK', value: 800, unit: 'rpm' },
      COOLANT_TEMP: { status: 'OK', value: -40, unit: '°C' },
    })],
  });
  const report = runDiagnostics(input);
  const top = report.hypotheses[0];

  it('identifica a leitura como fisicamente incoerente, não como uma condição real do motor', () => {
    expect(top.description).toMatch(/incoerente/i);
  });

  it('recomenda verificar fiação/conector antes de qualquer conclusão sobre o motor', () => {
    expect(top.nextTest!.id).toBe('test-sensor-wiring-continuity');
  });
});

describe('Garantias estruturais do benchmark (todos os cenários acima)', () => {
  const allCases: DiagnosticCase[] = [
    emptyCase({ samples: [sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, LTFT_B1: { status: 'OK', value: 20, unit: '%' } })] }),
    emptyCase({ dtcs: [{ code: 'P0301', description: null }] }),
    emptyCase({ samples: [sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 11, unit: 'V' } })] }),
    emptyCase({ samples: [sample('idle', { COOLANT_TEMP: { status: 'OK', value: 115, unit: '°C' } })] }),
    emptyCase(),
  ];

  it('nenhum relatório, em nenhum cenário, recomenda troca de peça sem um teste confirmado', () => {
    for (const c of allCases) {
      const report = runDiagnostics(c);
      for (const h of report.hypotheses) {
        expect(h.description).not.toMatch(NEVER_RECOMMEND_PART_SWAP);
        if (h.confidence > 0.65) {
          // só pode passar de 0.65 se houver um teste confirmado para esta hipótese
          const testIds = h.nextTest ? [h.nextTest.id] : [];
          const hasConfirmed = c.reportedTests.some(t => testIds.includes(t.testId) && t.outcome === 'confirms');
          expect(hasConfirmed).toBe(true);
        }
      }
    }
  });

  it('todo generatedAt é um timestamp recente e válido', () => {
    for (const c of allCases) {
      const report = runDiagnostics(c);
      const generated = new Date(report.generatedAt).getTime();
      expect(Number.isFinite(generated)).toBe(true);
      expect(Date.now() - generated).toBeLessThan(5000);
    }
  });
});

describe('Adversarial: o motor de diagnóstico nunca inventa um valor de torque', () => {
  // Verificação estática do código-fonte das regras, não só do output em
  // tempo de execução - nenhuma regra deveria sequer conter uma string de
  // torque (N·m/Nm/kgf·m), já que torque nunca é usado no raciocínio por
  // hipóteses (isso vive em data/torque-specifications.ts, com fonte).
  const rulesSource = readFileSync(join(__dirname, '..', 'lib', 'diagnostics', 'rules.ts'), 'utf-8');

  it('rules.ts não contém nenhuma unidade de torque (N·m, Nm, kgf·m)', () => {
    expect(rulesSource).not.toMatch(/\bN[·.]?m\b|kgf[·.]?m/);
  });
});

