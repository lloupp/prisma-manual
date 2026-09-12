import { Evidence, ReportedTestResult } from './types';

const WEIGHT: Record<Evidence['strength'], number> = {
  weak: 0.15,
  moderate: 0.3,
  strong: 0.45,
};

/** Teto de confiança sem nenhum teste discriminante confirmado. Existe para
 * impedir estruturalmente a certeza prematura: por mais evidência indireta
 * que se acumule (fuel trims, DTCs, temperatura), o motor nunca deveria
 * "ter certeza" antes de um teste ter de fato confirmado a hipótese. */
const CAP_WITHOUT_CONFIRMED_TEST = 0.65;

/**
 * Calcula a confiança de uma hipótese de forma transparente e auditável -
 * soma pesos por força de evidência, nunca uma caixa-preta. Retesta
 * facilmente: mais evidência a favor sempre aumenta o valor; mais evidência
 * contra sempre diminui.
 */
export function computeConfidence(
  evidenceFor: Evidence[],
  evidenceAgainst: Evidence[],
  reportedTests: ReportedTestResult[] = [],
  hypothesisTestIds: string[] = [],
): number {
  const forScore = evidenceFor.reduce((sum, e) => sum + WEIGHT[e.strength], 0);
  const againstScore = evidenceAgainst.reduce((sum, e) => sum + WEIGHT[e.strength], 0);
  let raw = forScore - againstScore;

  const hasConfirmedTest = reportedTests.some(
    t => hypothesisTestIds.includes(t.testId) && t.outcome === 'confirms',
  );
  const hasRefutedTest = reportedTests.some(
    t => hypothesisTestIds.includes(t.testId) && t.outcome === 'refutes',
  );

  if (hasConfirmedTest) {
    // Um teste discriminante confirmado É a evidência mais forte possível -
    // não é só um "teto mais alto" sem efeito prático. Sem isto, uma
    // hipótese cuja evidência indireta se cancela (a favor == contra, ex.:
    // duas amostras quase idênticas) continuaria em 0% mesmo depois de o
    // usuário confirmar fisicamente o teste, o que é o oposto do esperado.
    raw += WEIGHT.strong;
  }
  if (hasRefutedTest) {
    // Um teste discriminante que refuta a hipótese pesa mais que qualquer
    // evidência indireta acumulada - a hipótese deve cair para perto de zero.
    raw = Math.min(raw, 0.1);
  }

  const cap = hasConfirmedTest ? 1 : CAP_WITHOUT_CONFIRMED_TEST;
  return Math.max(0, Math.min(cap, raw));
}
