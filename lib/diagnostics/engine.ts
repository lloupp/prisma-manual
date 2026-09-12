// lib/diagnostics/engine.ts
//
// Orquestração do motor de diagnóstico: roda todas as regras puras de
// rules.ts contra um DiagnosticCase e monta o DiagnosticReport final.
// Não há nenhuma decisão nova aqui sobre causas - só agregação, ordenação
// e a escolha de qual "próximo melhor teste" recomendar primeiro.

import { DiagnosticCase, DiagnosticReport, Hypothesis } from './types';
import { ALL_RULES } from './rules';

export function runDiagnostics(input: DiagnosticCase): DiagnosticReport {
  const hypotheses: Hypothesis[] = ALL_RULES
    .map(rule => rule(input))
    .filter((h): h is Hypothesis => h !== null)
    .sort((a, b) => b.confidence - a.confidence);

  // "hyp-insufficient-data" só aparece quando não há nenhuma amostra com
  // leitura válida - é diferente de "hypotheses.length === 0", que também
  // acontece quando os dados coletados são válidos mas não indicam nenhuma
  // anomalia (nenhuma regra de falha dispara porque o veículo está normal).
  // Confundir os dois faria a UI dizer "colete mais dados" para um usuário
  // que já coletou dados e simplesmente não tem nada de errado ainda.
  const insufficientData = hypotheses.length === 1 && hypotheses[0].id === 'hyp-insufficient-data';

  const top = hypotheses.find(h => h.id !== 'hyp-insufficient-data');

  let overallNextStep: string;
  if (insufficientData) {
    overallNextStep = 'Colete pelo menos uma amostra de dados ao vivo com o motor em funcionamento antes de levantar hipóteses.';
  } else if (!top) {
    overallNextStep = 'Nenhuma anomalia identificada nos dados coletados até agora. Se o sintoma persistir, colete uma amostra em outro regime (ex.: rotação mais alta) ou descreva o sintoma com mais detalhe.';
  } else if (top.nextTest) {
    overallNextStep = `Hipótese mais provável: "${top.description}". Próximo teste recomendado: ${top.nextTest.description}`;
  } else {
    overallNextStep = 'Nenhum próximo teste específico disponível - reavalie os dados coletados.';
  }

  return {
    generatedAt: new Date().toISOString(),
    hypotheses,
    insufficientData,
    overallNextStep,
  };
}
