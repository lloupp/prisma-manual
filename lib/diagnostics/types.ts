// lib/diagnostics/types.ts
//
// Tipos do motor de diagnóstico por hipóteses. O motor é uma engine de
// regras determinística (não é um LLM - não há chave de API disponível
// neste ambiente) que implementa o ciclo pedido:
//
//   SINTOMA -> DADOS -> HIPÓTESES -> EVIDÊNCIAS A FAVOR -> EVIDÊNCIAS
//   CONTRA -> DADOS AUSENTES -> PRÓXIMO MELHOR TESTE -> RESULTADO -> REAVALIAÇÃO
//
// Cada hipótese nunca afirma "troque a peça X" - ela descreve um sistema
// candidato, o peso da evidência disponível e o próximo teste barato/seguro
// que ajudaria a confirmar ou descartar. Isso é o "cérebro" que um agente
// (humano ou, no futuro, um LLM através das mesmas ferramentas seguras de
// lib/agent-tools.ts) usa para conduzir o diagnóstico.

export type PidStatus = 'OK' | 'NOT_SUPPORTED' | 'NO_RESPONSE' | 'TIMEOUT' | 'PROTOCOL_ERROR' | 'STALE';

export interface PidValue {
  status: PidStatus;
  value?: number;
  unit?: string;
}

/** Uma amostra de dados ao vivo, rotulada com o regime em que foi colhida
 * (marcha lenta, rotação mais alta, motor frio etc.) para permitir regras
 * que comparam o comportamento entre regimes - ex.: "LTFT melhora em
 * rotação mais alta" é uma assinatura clássica de vazamento de vácuo. */
export interface DiagnosticSample {
  label: 'idle' | 'higher_rpm' | 'cold_start' | 'warm' | 'unspecified';
  takenAt: string; // ISO timestamp
  pids: Partial<Record<PidShortName, PidValue>>;
}

export type PidShortName =
  | 'RPM'
  | 'COOLANT_TEMP'
  | 'CONTROL_MODULE_VOLTAGE'
  | 'ENGINE_LOAD'
  | 'THROTTLE_POSITION'
  | 'STFT_B1'
  | 'LTFT_B1'
  | 'INTAKE_MAP'
  | 'INTAKE_AIR_TEMP'
  | 'MAF_RATE'
  | 'VEHICLE_SPEED'
  | 'FUEL_LEVEL';

export interface DiagnosticDtc {
  code: string;
  description: string | null;
}

/** Resultado de um teste que o usuário executou manualmente e reportou de
 * volta ao motor de diagnóstico, fechando o ciclo de reavaliação. */
export interface ReportedTestResult {
  testId: string;
  outcome: 'confirms' | 'refutes' | 'inconclusive';
  notes?: string;
}

/** Um caso de diagnóstico - tudo que o motor recebe para gerar hipóteses.
 * É intencionalmente um objeto simples e serializável (sem I/O), para que
 * o motor seja uma função pura e fácil de testar. */
export interface DiagnosticCase {
  symptom: string;
  dtcs: DiagnosticDtc[];
  samples: DiagnosticSample[];
  reportedTests: ReportedTestResult[];
}

export interface Evidence {
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  /** De onde veio esta evidência - um PID, um DTC, um teste reportado. */
  basedOn: string;
}

export type TestSafety = 'safe' | 'caution' | 'requires_professional';
export type TestCost = 'low' | 'medium' | 'high';

export interface DiagnosticTest {
  id: string;
  description: string;
  cost: TestCost;
  safety: TestSafety;
  /** O que este teste ajudaria a distinguir - nunca proponha um teste sem
   * dizer para que ele serve. */
  discriminates: string;
}

export interface Hypothesis {
  id: string;
  description: string;
  /** Tag do sistema envolvido - usada só para linkar com o manual
   * (data/systems.ts); nunca aparece como "diagnóstico confirmado". */
  relatedSystemId: string;
  confidence: number; // 0-1, nunca inflado sem teste discriminante
  evidenceFor: Evidence[];
  evidenceAgainst: Evidence[];
  missingData: string[];
  nextTest: DiagnosticTest | null;
  /** Nota da própria regra explicando a natureza do limiar usado (ex.:
   * "heurística genérica de diagnóstico, não uma especificação do Prisma"),
   * exibida para nunca deixar o usuário achar que é um dado do veículo. */
  heuristicNote?: string;
}

export interface DiagnosticReport {
  generatedAt: string;
  hypotheses: Hypothesis[];
  /** true quando os dados disponíveis são insuficientes para qualquer
   * hipótese razoável - o motor deve preferir dizer isso a inventar uma
   * hipótese fraca só para ter o que mostrar. */
  insufficientData: boolean;
  overallNextStep: string;
}
