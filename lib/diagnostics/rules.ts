// lib/diagnostics/rules.ts
//
// Cada regra é uma função pura: (DiagnosticCase) -> Hypothesis | null.
// Os limiares usados aqui (ex.: LTFT > 10%, tensão < 13V, temperatura >
// 100°C) são heurísticas GENÉRICAS de diagnóstico OBD-II amplamente
// ensinadas e publicadas (não são específicas do Chevrolet Prisma) - cada
// hipótese carrega um `heuristicNote` deixando isso explícito, para nunca
// serem confundidas com uma especificação confirmada do veículo (essas
// vivem em data/specifications.ts, com fonte oficial). Nenhuma regra aqui
// afirma "troque a peça X" - o resultado é sempre uma hipótese com peso de
// evidência e um próximo teste barato e seguro.

import { DiagnosticCase, DiagnosticTest, Evidence, Hypothesis } from './types';
import { computeConfidence } from './scoring';
import { findSample, getPid, isNumericOk, hasDtcMatching, engineIsRunning } from './utils';

const GENERIC_HEURISTIC = 'Heurística genérica de diagnóstico OBD-II amplamente usada no setor - não é uma especificação confirmada do Chevrolet Prisma.';

// ── Testes reutilizáveis ──────────────────────────────────────────────

const TEST_COMPARE_RPM_REGIMES: DiagnosticTest = {
  id: 'test-compare-rpm-regimes',
  description: 'Com o motor quente, compare o STFT/LTFT em marcha lenta e em ~2.500rpm em ponto morto.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Vazamento de vácuo (efeito proporcionalmente menor em rotação mais alta) vs. outra causa de mistura pobre/rica que se mantém proporcional em qualquer rotação.',
};

const TEST_VACUUM_LEAK_SMOKE: DiagnosticTest = {
  id: 'test-vacuum-leak-smoke-or-carb-spray',
  description: 'Com o motor em marcha lenta, borrife limpador de contato/carburador ao redor de juntas do coletor de admissão e mangueiras de vácuo; uma variação momentânea de rotação indica o ponto do vazamento.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Localiza fisicamente um vazamento de vácuo, se existir.',
};

const TEST_COIL_PLUG_SWAP: DiagnosticTest = {
  id: 'test-coil-plug-swap',
  description: 'Troque a vela e/ou a bobina do cilindro com falha por uma de outro cilindro e leia os DTCs novamente. Se a falha "seguir" a peça trocada, a peça é a causa; se continuar no mesmo cilindro, a causa é do próprio cilindro (compressão, injetor).',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Vela/bobina com defeito vs. problema mecânico ou de injeção específico do cilindro.',
};

const TEST_FUEL_TRIMS_DURING_MISFIRE: DiagnosticTest = {
  id: 'test-fuel-trims-and-freeze-frame',
  description: 'Leia STFT/LTFT e o freeze frame no momento do DTC de falha de ignição.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Falha de ignição associada a mistura pobre/rica vs. falha puramente mecânica/elétrica.',
};

const TEST_VOLTAGE_AT_HIGHER_RPM: DiagnosticTest = {
  id: 'test-voltage-at-higher-rpm',
  description: 'Com o motor ligado, compare a tensão do módulo de controle em marcha lenta e em ~2.000rpm.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Muitos alternadores só atingem a saída plena acima da marcha lenta - esse teste distingue sistema de carga insuficiente de uma leitura momentânea baixa.',
};

const TEST_BATTERY_TERMINALS: DiagnosticTest = {
  id: 'test-battery-terminals-and-belt',
  description: 'Com o motor desligado, verifique o aperto e a limpeza dos terminais da bateria e a tensão/estado da correia do alternador.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Causa simples (conexão/correia) vs. falha do alternador/regulador propriamente dito.',
};

const TEST_COOLANT_LEVEL_AND_FAN: DiagnosticTest = {
  id: 'test-coolant-level-and-fan',
  description: 'Com o motor frio, verifique o nível do líquido de arrefecimento, vazamentos visíveis e se a ventoinha liga com o motor quente.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Nível baixo/vazamento vs. falha da ventoinha vs. termostato - descarta as causas mais simples antes de qualquer desmontagem.',
};

const TEST_SENSOR_WIRING_CHECK: DiagnosticTest = {
  id: 'test-sensor-wiring-continuity',
  description: 'Com a chave desligada, verifique a fiação e o conector do sensor quanto a continuidade, corrosão ou mau contato.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Sensor/fiação com defeito vs. condição real do motor.',
};

const TEST_COLLECT_LIVE_DATA: DiagnosticTest = {
  id: 'test-collect-live-data',
  description: 'Conecte o scanner com o motor em funcionamento e colete pelo menos uma amostra de dados ao vivo em marcha lenta.',
  cost: 'low',
  safety: 'safe',
  discriminates: 'Sem nenhuma amostra de dados ao vivo, nenhuma hipótese pode ser avaliada com confiança.',
};

const TEST_FUEL_PRESSURE_AND_INJECTOR_CHECK: DiagnosticTest = {
  id: 'test-fuel-pressure-and-injector-leak',
  description: 'Verifique a pressão de combustível na linha (comparando com a especificação do sistema, se conhecida) e observe se algum injetor goteja com a chave desligada.',
  cost: 'medium',
  safety: 'caution',
  discriminates: 'Pressão de combustível alta vs. injetor vazando vs. sensor MAF superestimando fluxo de ar.',
};

// ── Regras ────────────────────────────────────────────────────────────

/** Lê o trim combinado (LTFT+STFT) de uma amostra em marcha lenta. Retorna
 * null se não houver leitura numérica válida de nenhum dos dois - nunca
 * trata um PID ausente/inválido como 0% de trim. */
function readIdleCombinedTrim(input: DiagnosticCase): number | null {
  const idle = findSample(input, 'idle');
  if (!idle || !engineIsRunning(idle)) return null;
  const ltft = getPid(idle, 'LTFT_B1');
  const stft = getPid(idle, 'STFT_B1');
  if (!isNumericOk(ltft) && !isNumericOk(stft)) return null;
  return (isNumericOk(ltft) ? ltft.value : 0) + (isNumericOk(stft) ? stft.value : 0);
}

const FUEL_TRIM_THRESHOLD = 10; // % - heurística genérica, ver GENERIC_HEURISTIC

/**
 * Mistura pobre em marcha lenta. A assinatura de "trim melhora
 * proporcionalmente em rotação mais alta" É uma heurística genérica real e
 * amplamente ensinada especificamente para vazamento de vácuo (um furo de
 * tamanho fixo pesa proporcionalmente menos conforme o fluxo total de ar
 * sobe) - por isso só se aplica aqui, não ao espelho de mistura rica (ver
 * ruleRichMixture, que não tem um heurística equivalente estabelecida).
 */
export function ruleLeanMixture(input: DiagnosticCase): Hypothesis | null {
  const combined = readIdleCombinedTrim(input);
  if (combined === null || combined <= FUEL_TRIM_THRESHOLD) return null;

  const higher = findSample(input, 'higher_rpm');
  const evidenceFor: Evidence[] = [
    {
      description: `LTFT+STFT positivos em marcha lenta (${combined.toFixed(1)}%), acima do limiar genérico de +${FUEL_TRIM_THRESHOLD}%.`,
      strength: 'moderate',
      basedOn: 'idle:LTFT_B1+STFT_B1',
    },
  ];
  const evidenceAgainst: Evidence[] = [];
  const missingData: string[] = [];
  const testIds = [TEST_COMPARE_RPM_REGIMES.id, TEST_VACUUM_LEAK_SMOKE.id];

  if (higher) {
    const ltftHigh = getPid(higher, 'LTFT_B1');
    const stftHigh = getPid(higher, 'STFT_B1');
    if (isNumericOk(ltftHigh) || isNumericOk(stftHigh)) {
      const combinedHigh = (isNumericOk(ltftHigh) ? ltftHigh.value : 0) + (isNumericOk(stftHigh) ? stftHigh.value : 0);
      const improved = combinedHigh < combined * 0.5;
      if (improved) {
        evidenceFor.push({
          description: `Trim melhora significativamente em rotação mais alta (${combined.toFixed(1)}% em marcha lenta -> ${combinedHigh.toFixed(1)}% em rotação mais alta) - assinatura clássica de vazamento de vácuo, cujo efeito proporcional cai quando o fluxo de ar total aumenta.`,
          strength: 'strong',
          basedOn: 'higher_rpm:LTFT_B1+STFT_B1',
        });
      } else {
        evidenceAgainst.push({
          description: 'O trim não melhora proporcionalmente em rotação mais alta - menos consistente com um vazamento de vácuo simples; considere causas que afetam a mistura em qualquer regime (sensor MAF, pressão de combustível, injetor).',
          strength: 'moderate',
          basedOn: 'higher_rpm:LTFT_B1+STFT_B1',
        });
      }
    } else {
      missingData.push('Amostra em rotação mais alta não trouxe leitura válida de STFT/LTFT.');
    }
  } else {
    missingData.push('Sem amostra em rotação mais alta para comparar - não é possível diferenciar vazamento de vácuo de outras causas ainda.');
  }

  const confidence = computeConfidence(evidenceFor, evidenceAgainst, input.reportedTests, testIds);

  return {
    id: 'hyp-lean-mixture',
    description: 'Mistura pobre em marcha lenta (possível vazamento de vácuo, sensor de fluxo de ar ou entrega de combustível insuficiente).',
    relatedSystemId: 'sys-fuel',
    confidence,
    evidenceFor,
    evidenceAgainst,
    missingData,
    nextTest: higher ? TEST_VACUUM_LEAK_SMOKE : TEST_COMPARE_RPM_REGIMES,
    heuristicNote: GENERIC_HEURISTIC,
  };
}

/**
 * Mistura rica em marcha lenta. Diferente da mistura pobre, não existe uma
 * heurística genérica estabelecida de "melhora em rotação mais alta" para
 * causas de mistura rica (pressão de combustível alta, injetor vazando,
 * MAF superestimando fluxo) - inventar uma seria o tipo de heurística
 * fabricada que este motor deve evitar. Por isso a amostra em rotação mais
 * alta, quando existe, só é registrada como contexto adicional, e o
 * próximo teste recomendado é sempre a verificação direta de pressão de
 * combustível/injetor, não um teste de vazamento de vácuo (que só faz
 * sentido para mistura pobre).
 */
export function ruleRichMixture(input: DiagnosticCase): Hypothesis | null {
  const combined = readIdleCombinedTrim(input);
  if (combined === null || combined >= -FUEL_TRIM_THRESHOLD) return null;

  const higher = findSample(input, 'higher_rpm');
  const evidenceFor: Evidence[] = [
    {
      description: `LTFT+STFT negativos em marcha lenta (${combined.toFixed(1)}%), abaixo do limiar genérico de -${FUEL_TRIM_THRESHOLD}%.`,
      strength: 'moderate',
      basedOn: 'idle:LTFT_B1+STFT_B1',
    },
  ];
  const missingData: string[] = [];
  const testIds = [TEST_FUEL_PRESSURE_AND_INJECTOR_CHECK.id];

  if (!higher) {
    missingData.push('Sem amostra em rotação mais alta ainda - útil para registrar se a mistura rica persiste em qualquer regime, mesmo sem uma assinatura discriminante estabelecida como a de vazamento de vácuo.');
  }

  const confidence = computeConfidence(evidenceFor, [], input.reportedTests, testIds);

  return {
    id: 'hyp-rich-mixture',
    description: 'Mistura rica em marcha lenta (possível sensor MAF superestimando fluxo de ar, pressão de combustível alta ou injetor vazando).',
    relatedSystemId: 'sys-fuel',
    confidence,
    evidenceFor,
    evidenceAgainst: [],
    missingData,
    nextTest: TEST_FUEL_PRESSURE_AND_INJECTOR_CHECK,
    heuristicNote: GENERIC_HEURISTIC,
  };
}

export function ruleMisfire(input: DiagnosticCase): Hypothesis | null {
  const misfireDtcs = input.dtcs.filter(d => /^P030[0-8]$/.test(d.code));
  if (misfireDtcs.length === 0) return null;

  const evidenceFor: Evidence[] = misfireDtcs.map(d => ({
    description: `DTC ${d.code}${d.description ? ` (${d.description})` : ''} armazenado.`,
    strength: 'moderate',
    basedOn: `dtc:${d.code}`,
  }));
  const evidenceAgainst: Evidence[] = [];
  const missingData: string[] = [];
  const testIds = [TEST_FUEL_TRIMS_DURING_MISFIRE.id, TEST_COIL_PLUG_SWAP.id];

  const idle = findSample(input, 'idle');
  const trimsAvailable = idle && (isNumericOk(getPid(idle, 'LTFT_B1')) || isNumericOk(getPid(idle, 'STFT_B1')));
  if (!trimsAvailable) {
    missingData.push('Sem fuel trims/freeze frame associados ainda - com apenas o DTC, não é possível diferenciar causa de ignição, mecânica ou de mistura.');
  }
  if (misfireDtcs.length === 1 && misfireDtcs[0].code !== 'P0300') {
    missingData.push('Falha isolada em um único cilindro: um teste de troca cruzada de vela/bobina discrimina peça vs. cilindro antes de qualquer substituição.');
  } else {
    missingData.push('Falha em múltiplos cilindros ou não especificada (P0300): considere causas que afetam todos os cilindros (combustível, vácuo) antes de peças de ignição individuais.');
  }

  const confidence = computeConfidence(evidenceFor, evidenceAgainst, input.reportedTests, testIds);

  return {
    id: 'hyp-misfire',
    description: 'Falha de ignição detectada - causa ainda não diferenciada entre ignição (vela/bobina), mecânica (compressão) ou mistura (combustível/vácuo).',
    relatedSystemId: 'sys-engine-ignition',
    confidence,
    evidenceFor,
    evidenceAgainst,
    missingData,
    nextTest: trimsAvailable ? TEST_COIL_PLUG_SWAP : TEST_FUEL_TRIMS_DURING_MISFIRE,
    heuristicNote: 'Um DTC de falha de ignição, sozinho, nunca indica qual peça trocar - ver "dados ausentes" e o próximo teste antes de qualquer substituição.',
  };
}

export function ruleLowChargingVoltage(input: DiagnosticCase): Hypothesis | null {
  const idle = findSample(input, 'idle');
  if (!idle || !engineIsRunning(idle)) return null;
  const voltage = getPid(idle, 'CONTROL_MODULE_VOLTAGE');
  if (!isNumericOk(voltage)) return null;

  const threshold = 13.0; // V - heurística genérica de tensão mínima esperada de carga
  if (voltage.value >= threshold) return null;

  const evidenceFor: Evidence[] = [
    {
      description: `Tensão de ${voltage.value.toFixed(2)}V com motor em funcionamento, abaixo do limiar genérico de ${threshold}V esperado de um sistema de carga saudável.`,
      strength: 'moderate',
      basedOn: 'idle:CONTROL_MODULE_VOLTAGE',
    },
  ];
  const evidenceAgainst: Evidence[] = [];
  const missingData: string[] = [];
  const testIds = [TEST_VOLTAGE_AT_HIGHER_RPM.id, TEST_BATTERY_TERMINALS.id];

  const higher = findSample(input, 'higher_rpm');
  if (higher) {
    const voltageHigh = getPid(higher, 'CONTROL_MODULE_VOLTAGE');
    if (isNumericOk(voltageHigh) && voltageHigh.value >= threshold) {
      evidenceAgainst.push({
        description: `Tensão normaliza para ${voltageHigh.value.toFixed(2)}V em rotação mais alta - muitos alternadores só atingem saída plena acima da marcha lenta; menos consistente com falha do sistema de carga.`,
        strength: 'moderate',
        basedOn: 'higher_rpm:CONTROL_MODULE_VOLTAGE',
      });
    }
  } else {
    missingData.push('Sem amostra em rotação mais alta - necessária para descartar uma leitura de marcha lenta simplesmente baixa por natureza do alternador.');
  }

  const confidence = computeConfidence(evidenceFor, evidenceAgainst, input.reportedTests, testIds);

  return {
    id: 'hyp-low-charging-voltage',
    description: 'Sistema de carga possivelmente não suprindo tensão adequada com o motor em funcionamento.',
    relatedSystemId: 'sys-electrical-battery',
    confidence,
    evidenceFor,
    evidenceAgainst,
    missingData,
    nextTest: higher ? TEST_BATTERY_TERMINALS : TEST_VOLTAGE_AT_HIGHER_RPM,
    heuristicNote: GENERIC_HEURISTIC,
  };
}

export function ruleOverheating(input: DiagnosticCase): Hypothesis | null {
  const sample = findSample(input, 'idle') ?? findSample(input, 'warm') ?? findSample(input, 'higher_rpm');
  if (!sample) return null;
  const temp = getPid(sample, 'COOLANT_TEMP');
  if (!isNumericOk(temp)) return null;

  const threshold = 105; // °C - heurística genérica, motor de combustão típico
  if (temp.value < threshold) return null;

  const evidenceFor: Evidence[] = [
    {
      description: `Temperatura do líquido de arrefecimento de ${temp.value.toFixed(0)}°C, acima do limiar genérico de ${threshold}°C considerado normal para a maioria dos motores a gasolina.`,
      strength: 'strong',
      basedOn: `${sample.label}:COOLANT_TEMP`,
    },
  ];

  const confidence = computeConfidence(evidenceFor, [], input.reportedTests, [TEST_COOLANT_LEVEL_AND_FAN.id]);

  return {
    id: 'hyp-overheating',
    description: 'Motor operando acima da temperatura normal - possível nível baixo de líquido de arrefecimento, vazamento, falha da ventoinha ou termostato.',
    relatedSystemId: 'sys-cooling',
    confidence,
    evidenceFor,
    evidenceAgainst: [],
    missingData: ['Sem verificação visual ainda de nível, vazamento ou funcionamento da ventoinha.'],
    nextTest: TEST_COOLANT_LEVEL_AND_FAN,
    heuristicNote: `${GENERIC_HEURISTIC} A temperatura real de abertura do termostato do Prisma 1.0 não foi confirmada em documentação técnica (ver /especificacoes) - use este limiar só como triagem inicial.`,
  };
}

export function ruleIncoherentSensor(input: DiagnosticCase): Hypothesis | null {
  for (const sample of input.samples) {
    const temp = getPid(sample, 'COOLANT_TEMP');
    if (isNumericOk(temp) && engineIsRunning(sample) && temp.value < -30) {
      return {
        id: `hyp-incoherent-sensor-coolant-${sample.label}`,
        description: 'Leitura de temperatura do arrefecimento fisicamente incoerente com o motor em funcionamento - possível falha no circuito/fiação do sensor, não uma condição real do motor.',
        relatedSystemId: 'sys-cooling',
        confidence: computeConfidence(
          [{ description: `Temperatura de ${temp.value.toFixed(0)}°C com motor em funcionamento é fisicamente improvável.`, strength: 'strong', basedOn: `${sample.label}:COOLANT_TEMP` }],
          [],
          input.reportedTests,
          [TEST_SENSOR_WIRING_CHECK.id],
        ),
        evidenceFor: [{ description: `Temperatura de ${temp.value.toFixed(0)}°C com motor em funcionamento é fisicamente improvável.`, strength: 'strong', basedOn: `${sample.label}:COOLANT_TEMP` }],
        evidenceAgainst: [],
        missingData: ['Sem verificação da fiação/conector do sensor ainda.'],
        nextTest: TEST_SENSOR_WIRING_CHECK,
        heuristicNote: 'Verificação de plausibilidade física, não uma especificação do veículo - qualquer sensor pode apresentar esse padrão quando o circuito está aberto ou em curto.',
      };
    }
  }
  return null;
}

export function ruleInsufficientData(input: DiagnosticCase): Hypothesis | null {
  const hasAnySample = input.samples.length > 0;
  const hasAnyOkReading = input.samples.some(s => Object.values(s.pids).some(p => p?.status === 'OK'));
  if (hasAnySample && hasAnyOkReading) return null;

  return {
    id: 'hyp-insufficient-data',
    description: input.dtcs.length > 0
      ? 'Há código(s) de falha registrado(s), mas nenhum dado ao vivo foi coletado ainda para investigar a causa.'
      : 'Dados insuficientes para levantar qualquer hipótese com confiança.',
    relatedSystemId: 'diagnostico',
    confidence: 0,
    evidenceFor: [],
    evidenceAgainst: [],
    missingData: ['Nenhuma amostra de dados ao vivo com leitura válida.'],
    nextTest: TEST_COLLECT_LIVE_DATA,
  };
}

export const ALL_RULES = [
  ruleLeanMixture,
  ruleRichMixture,
  ruleMisfire,
  ruleLowChargingVoltage,
  ruleOverheating,
  ruleIncoherentSensor,
  ruleInsufficientData,
] as const;
