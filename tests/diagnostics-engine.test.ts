// Testes do motor de diagnóstico por hipóteses (lib/diagnostics). Cobrem:
// 1) comportamento correto das regras dado um DiagnosticCase sintético;
// 2) as garantias estruturais pedidas - nunca "troque a peça X" direto,
//    nunca confiança inflada sem teste discriminante confirmado, nunca
//    tratar timeout/PID não suportado como leitura válida (zero).
import { describe, it, expect } from 'vitest';
import { runDiagnostics } from '../lib/diagnostics/engine';
import { computeConfidence } from '../lib/diagnostics/scoring';
import {
  ruleLeanMixture, ruleRichMixture, ruleMisfire, ruleLowChargingVoltage,
  ruleOverheating, ruleIncoherentSensor, ruleInsufficientData, ALL_RULES,
} from '../lib/diagnostics/rules';
import { DiagnosticCase, DiagnosticSample, Evidence } from '../lib/diagnostics/types';

function sample(label: DiagnosticSample['label'], pids: DiagnosticSample['pids']): DiagnosticSample {
  return { label, takenAt: new Date().toISOString(), pids };
}

function emptyCase(overrides: Partial<DiagnosticCase> = {}): DiagnosticCase {
  return { symptom: 'teste', dtcs: [], samples: [], reportedTests: [], ...overrides };
}

describe('computeConfidence - nunca infla confiança prematuramente', () => {
  const maximalEvidence: Evidence[] = [
    { description: 'a', strength: 'strong', basedOn: 'x' },
    { description: 'b', strength: 'strong', basedOn: 'x' },
    { description: 'c', strength: 'strong', basedOn: 'x' },
    { description: 'd', strength: 'strong', basedOn: 'x' },
  ];

  it('mesmo com evidência indireta máxima, sem teste confirmado o teto é 0.65', () => {
    const confidence = computeConfidence(maximalEvidence, [], [], ['test-x']);
    expect(confidence).toBeLessThanOrEqual(0.65);
  });

  it('com um teste discriminante confirmado, pode chegar a 1', () => {
    const confidence = computeConfidence(
      maximalEvidence, [], [{ testId: 'test-x', outcome: 'confirms' }], ['test-x'],
    );
    expect(confidence).toBe(1);
  });

  it('confirmar um teste discriminante aumenta a confiança mesmo quando a evidência indireta se cancela (bug encontrado testando a UI real: um "Confirmou" que não move a agulha)', () => {
    const canceledEvidence: Evidence[] = [{ description: 'a favor', strength: 'moderate', basedOn: 'x' }];
    const canceledAgainst: Evidence[] = [{ description: 'contra', strength: 'moderate', basedOn: 'x' }];
    const withoutTest = computeConfidence(canceledEvidence, canceledAgainst, [], ['test-x']);
    const withConfirmedTest = computeConfidence(
      canceledEvidence, canceledAgainst, [{ testId: 'test-x', outcome: 'confirms' }], ['test-x'],
    );
    expect(withoutTest).toBe(0);
    expect(withConfirmedTest).toBeGreaterThan(withoutTest);
  });

  it('um teste discriminante que refuta derruba a confiança para perto de zero, mesmo com evidência indireta forte', () => {
    const confidence = computeConfidence(
      maximalEvidence, [], [{ testId: 'test-x', outcome: 'refutes' }], ['test-x'],
    );
    expect(confidence).toBeLessThanOrEqual(0.1);
  });

  it('nunca é negativa mesmo com evidência contra maior que a favor', () => {
    const confidence = computeConfidence([], maximalEvidence, [], []);
    expect(confidence).toBe(0);
  });
});

describe('ruleInsufficientData', () => {
  it('dispara quando não há nenhuma amostra', () => {
    const hyp = ruleInsufficientData(emptyCase());
    expect(hyp).not.toBeNull();
    expect(hyp!.confidence).toBe(0);
  });

  it('dispara quando há amostras mas nenhuma leitura OK', () => {
    const input = emptyCase({ samples: [sample('idle', { RPM: { status: 'NO_RESPONSE' } })] });
    expect(ruleInsufficientData(input)).not.toBeNull();
  });

  it('não dispara quando há pelo menos uma leitura OK', () => {
    const input = emptyCase({ samples: [sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' } })] });
    expect(ruleInsufficientData(input)).toBeNull();
  });

  it('nunca trata TIMEOUT/NOT_SUPPORTED como leitura válida (zero)', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'TIMEOUT' },
        LTFT_B1: { status: 'NOT_SUPPORTED' },
        STFT_B1: { status: 'STALE' },
      })],
    });
    // Nenhuma regra numérica deveria disparar - todas exigem status 'OK'.
    for (const rule of ALL_RULES) {
      if (rule === ruleInsufficientData) continue;
      expect(rule(input)).toBeNull();
    }
    expect(ruleInsufficientData(input)).not.toBeNull();
  });
});

describe('ruleLeanMixture / ruleRichMixture', () => {
  it('detecta mistura pobre em marcha lenta com trims combinados > 10%', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 8, unit: '%' },
        STFT_B1: { status: 'OK', value: 5, unit: '%' },
      })],
    });
    const hyp = ruleLeanMixture(input);
    expect(hyp).not.toBeNull();
    expect(hyp!.evidenceFor.length).toBeGreaterThan(0);
  });

  it('reconhece a assinatura de vazamento de vácuo quando o trim melhora em rotação mais alta (evidência forte)', () => {
    const input = emptyCase({
      samples: [
        sample('idle', {
          RPM: { status: 'OK', value: 800, unit: 'rpm' },
          LTFT_B1: { status: 'OK', value: 15, unit: '%' },
          STFT_B1: { status: 'OK', value: 5, unit: '%' },
        }),
        sample('higher_rpm', {
          RPM: { status: 'OK', value: 2500, unit: 'rpm' },
          LTFT_B1: { status: 'OK', value: 3, unit: '%' },
          STFT_B1: { status: 'OK', value: 1, unit: '%' },
        }),
      ],
    });
    const hyp = ruleLeanMixture(input);
    expect(hyp).not.toBeNull();
    expect(hyp!.evidenceFor.some(e => e.strength === 'strong')).toBe(true);
    // Sem teste discriminante confirmado, mesmo com evidência forte, o teto estrutural se aplica.
    expect(hyp!.confidence).toBeLessThanOrEqual(0.65);
  });

  it('sem amostra em rotação mais alta, registra isso como dado ausente em vez de concluir', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 15, unit: '%' },
        STFT_B1: { status: 'OK', value: 5, unit: '%' },
      })],
    });
    const hyp = ruleLeanMixture(input);
    expect(hyp!.missingData.length).toBeGreaterThan(0);
    expect(hyp!.nextTest).not.toBeNull();
  });

  it('detecta mistura rica em marcha lenta com trims combinados < -10%', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: -12, unit: '%' },
        STFT_B1: { status: 'OK', value: -3, unit: '%' },
      })],
    });
    expect(ruleRichMixture(input)).not.toBeNull();
    expect(ruleLeanMixture(input)).toBeNull();
  });

  it('não dispara com trims dentro da faixa normal', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 2, unit: '%' },
        STFT_B1: { status: 'OK', value: 1, unit: '%' },
      })],
    });
    expect(ruleLeanMixture(input)).toBeNull();
    expect(ruleRichMixture(input)).toBeNull();
  });

  it('mistura rica com amostra em rotação mais alta nunca afirma falsamente "não melhora" nem recomenda o teste de vazamento de vácuo (bug encontrado pela crítica independente: a lógica de melhora em rotação mais alta é específica de mistura pobre, não um espelho simétrico)', () => {
    const input = emptyCase({
      samples: [
        sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, LTFT_B1: { status: 'OK', value: -12, unit: '%' }, STFT_B1: { status: 'OK', value: -3, unit: '%' } }),
        sample('higher_rpm', { RPM: { status: 'OK', value: 2500, unit: 'rpm' }, LTFT_B1: { status: 'OK', value: -2, unit: '%' }, STFT_B1: { status: 'OK', value: -1, unit: '%' } }),
      ],
    });
    const hyp = ruleRichMixture(input);
    expect(hyp).not.toBeNull();
    expect(hyp!.evidenceAgainst).toEqual([]);
    expect(hyp!.evidenceFor.some(e => /não melhora/i.test(e.description))).toBe(false);
    expect(hyp!.nextTest!.id).toBe('test-fuel-pressure-and-injector-leak');
  });
});

describe('ruleMisfire - nunca conclui qual peça trocar sem dados suficientes', () => {
  it('dispara com um DTC de falha de ignição, mas com confiança baixa e dados ausentes quando não há mais nada', () => {
    const input = emptyCase({ dtcs: [{ code: 'P0301', description: 'Falha de ignição - cilindro 1' }] });
    const hyp = ruleMisfire(input);
    expect(hyp).not.toBeNull();
    expect(hyp!.missingData.length).toBeGreaterThan(0);
    expect(hyp!.nextTest).not.toBeNull();
    // Nunca recomenda a substituição direta de uma peça específica.
    expect(hyp!.description).not.toMatch(/troque a (peça|vela|bobina)/i);
  });

  it('recomenda teste de troca cruzada vela/bobina só depois de já ter fuel trims disponíveis', () => {
    const input = emptyCase({
      dtcs: [{ code: 'P0302', description: null }],
      samples: [sample('idle', { LTFT_B1: { status: 'OK', value: 1, unit: '%' } })],
    });
    const hyp = ruleMisfire(input);
    expect(hyp!.nextTest!.id).toBe('test-coil-plug-swap');
  });

  it('sem fuel trims ainda, recomenda coletá-los antes de qualquer teste de troca de peça', () => {
    const input = emptyCase({ dtcs: [{ code: 'P0300', description: 'Falha de ignição aleatória' }] });
    const hyp = ruleMisfire(input);
    expect(hyp!.nextTest!.id).toBe('test-fuel-trims-and-freeze-frame');
  });

  it('nenhum hypothesis.description de nenhuma regra instrui troca direta de peça', () => {
    const cases: DiagnosticCase[] = [
      emptyCase({ dtcs: [{ code: 'P0301', description: null }] }),
      emptyCase({ samples: [sample('idle', { LTFT_B1: { status: 'OK', value: 20, unit: '%' } })] }),
      emptyCase({ samples: [sample('idle', { CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 11.5, unit: 'V' }, RPM: { status: 'OK', value: 800, unit: 'rpm' } })] }),
    ];
    const forbidden = /troque (a|o) (peça|vela|bobina|bateria|sensor|alternador)/i;
    for (const c of cases) {
      for (const rule of ALL_RULES) {
        const hyp = rule(c);
        if (hyp) expect(hyp.description).not.toMatch(forbidden);
      }
    }
  });
});

describe('ruleLowChargingVoltage', () => {
  it('dispara com tensão abaixo de 13V em marcha lenta com motor ligado', () => {
    const input = emptyCase({
      samples: [sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 12.1, unit: 'V' } })],
    });
    expect(ruleLowChargingVoltage(input)).not.toBeNull();
  });

  it('não dispara se o motor não estiver em funcionamento (RPM ausente/zero)', () => {
    const input = emptyCase({
      samples: [sample('idle', { CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 11.8, unit: 'V' } })],
    });
    expect(ruleLowChargingVoltage(input)).toBeNull();
  });

  it('quando a tensão normaliza em rotação mais alta, isso conta como evidência contra falha do sistema de carga', () => {
    const input = emptyCase({
      samples: [
        sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 12.3, unit: 'V' } }),
        sample('higher_rpm', { RPM: { status: 'OK', value: 2000, unit: 'rpm' }, CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 13.8, unit: 'V' } }),
      ],
    });
    const hyp = ruleLowChargingVoltage(input);
    expect(hyp).not.toBeNull();
    expect(hyp!.evidenceAgainst.length).toBeGreaterThan(0);
  });
});

describe('ruleOverheating', () => {
  it('dispara com temperatura acima do limiar genérico e cita a especificação real como não verificada', () => {
    const input = emptyCase({ samples: [sample('idle', { COOLANT_TEMP: { status: 'OK', value: 112, unit: '°C' } })] });
    const hyp = ruleOverheating(input);
    expect(hyp).not.toBeNull();
    expect(hyp!.heuristicNote).toMatch(/não foi confirmada/i);
  });

  it('não dispara com temperatura normal', () => {
    const input = emptyCase({ samples: [sample('idle', { COOLANT_TEMP: { status: 'OK', value: 90, unit: '°C' } })] });
    expect(ruleOverheating(input)).toBeNull();
  });
});

describe('ruleIncoherentSensor', () => {
  it('detecta uma leitura de temperatura fisicamente impossível com o motor em funcionamento', () => {
    const input = emptyCase({
      samples: [sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, COOLANT_TEMP: { status: 'OK', value: -40, unit: '°C' } })],
    });
    expect(ruleIncoherentSensor(input)).not.toBeNull();
  });

  it('não dispara com leituras plausíveis', () => {
    const input = emptyCase({
      samples: [sample('idle', { RPM: { status: 'OK', value: 800, unit: 'rpm' }, COOLANT_TEMP: { status: 'OK', value: 90, unit: '°C' } })],
    });
    expect(ruleIncoherentSensor(input)).toBeNull();
  });
});

describe('runDiagnostics - orquestração', () => {
  it('sinaliza insufficientData quando não há amostras nem DTCs', () => {
    const report = runDiagnostics(emptyCase());
    expect(report.insufficientData).toBe(true);
    expect(report.hypotheses.length).toBe(1);
    expect(report.hypotheses[0].id).toBe('hyp-insufficient-data');
  });

  it('ordena hipóteses por confiança decrescente', () => {
    const input = emptyCase({
      dtcs: [{ code: 'P0301', description: null }],
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 15, unit: '%' },
        STFT_B1: { status: 'OK', value: 5, unit: '%' },
        CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 12.0, unit: 'V' },
      })],
    });
    const report = runDiagnostics(input);
    expect(report.hypotheses.length).toBeGreaterThan(1);
    for (let i = 1; i < report.hypotheses.length; i++) {
      expect(report.hypotheses[i - 1].confidence).toBeGreaterThanOrEqual(report.hypotheses[i].confidence);
    }
  });

  it('overallNextStep referencia o próximo teste da hipótese mais provável, não uma conclusão', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        LTFT_B1: { status: 'OK', value: 15, unit: '%' },
        STFT_B1: { status: 'OK', value: 5, unit: '%' },
      })],
    });
    const report = runDiagnostics(input);
    expect(report.insufficientData).toBe(false);
    expect(report.overallNextStep.length).toBeGreaterThan(0);
    expect(report.overallNextStep).not.toMatch(/troque (a|o) (peça|vela|bobina|bateria)/i);
  });

  it('generatedAt é um timestamp ISO válido', () => {
    const report = runDiagnostics(emptyCase());
    expect(() => new Date(report.generatedAt).toISOString()).not.toThrow();
  });

  it('com uma amostra válida mas sem nenhuma anomalia, NUNCA reporta insufficientData (bug encontrado testando a UI real: dado coletado não é o mesmo que dado ausente)', () => {
    const input = emptyCase({
      samples: [sample('idle', {
        RPM: { status: 'OK', value: 800, unit: 'rpm' },
        COOLANT_TEMP: { status: 'OK', value: 90, unit: '°C' },
        LTFT_B1: { status: 'OK', value: 1, unit: '%' },
        STFT_B1: { status: 'OK', value: 0, unit: '%' },
        CONTROL_MODULE_VOLTAGE: { status: 'OK', value: 14.2, unit: 'V' },
      })],
    });
    const report = runDiagnostics(input);
    expect(report.insufficientData).toBe(false);
    expect(report.hypotheses.length).toBe(0);
    expect(report.overallNextStep).toMatch(/nenhuma anomalia/i);
  });
});
