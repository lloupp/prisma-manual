'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DiagnosticReport, Hypothesis } from '../../lib/diagnostics/types';

interface HypothesisListProps {
  report: DiagnosticReport;
  onReportTest?: (testId: string, outcome: 'confirms' | 'refutes' | 'inconclusive', notes: string) => void;
}

const STRENGTH_COLOR: Record<string, string> = {
  weak: 'text-zinc-500',
  moderate: 'text-amber-400',
  strong: 'text-emerald-400',
};

const SAFETY_LABEL: Record<string, string> = {
  safe: 'Seguro',
  caution: 'Cautela',
  requires_professional: 'Requer profissional',
};

const COST_LABEL: Record<string, string> = {
  low: 'Baixo custo',
  medium: 'Custo médio',
  high: 'Alto custo',
};

export default function HypothesisList({ report, onReportTest }: HypothesisListProps) {
  if (report.insufficientData) {
    return (
      <div className="bg-amber-900/20 border border-amber-900/30 rounded-xl p-5 text-amber-200 text-sm">
        {report.hypotheses[0]?.description ?? 'Dados insuficientes.'}
        {report.hypotheses[0]?.nextTest && (
          <p className="mt-2 text-zinc-300">{report.hypotheses[0].nextTest.description}</p>
        )}
      </div>
    );
  }

  const hypotheses = report.hypotheses.filter(h => h.id !== 'hyp-insufficient-data');

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300">
        <strong className="text-zinc-100">Próximo passo: </strong>{report.overallNextStep}
      </div>
      {hypotheses.length === 0 && (
        <div className="bg-emerald-900/20 border border-emerald-900/30 rounded-xl p-5 text-emerald-200 text-sm">
          Nenhuma anomalia identificada nos dados coletados até agora - isso não significa que o
          motor está confirmadamente saudável, apenas que nenhuma regra de falha disparou com o que
          já foi lido.
        </div>
      )}
      {hypotheses.map((hypothesis, index) => (
        <HypothesisCard
          key={hypothesis.id}
          hypothesis={hypothesis}
          isTopHypothesis={index === 0}
          onReportTest={onReportTest}
        />
      ))}
    </div>
  );
}

function HypothesisCard({
  hypothesis, isTopHypothesis, onReportTest,
}: { hypothesis: Hypothesis; isTopHypothesis: boolean; onReportTest?: HypothesisListProps['onReportTest'] }) {
  const [notes, setNotes] = useState('');
  const confidencePct = Math.round(hypothesis.confidence * 100);

  return (
    <div className={`bg-zinc-900 rounded-xl border p-5 flex flex-col gap-3 ${isTopHypothesis ? 'border-cyan-700/50' : 'border-zinc-800'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-zinc-100">{hypothesis.description}</h3>
        {isTopHypothesis && (
          <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded-full whitespace-nowrap">
            Hipótese mais provável
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500" style={{ width: `${confidencePct}%` }} />
        </div>
        <span className="text-xs text-zinc-400 w-10 text-right">{confidencePct}%</span>
      </div>
      {hypothesis.confidence <= 0.65 && (
        <p className="text-xs text-zinc-500">
          Confiança limitada a 65% sem um teste discriminante confirmado - o motor nunca assume
          certeza só por evidência indireta.
        </p>
      )}

      {hypothesis.evidenceFor.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-1">Evidências a favor</p>
          <ul className="text-sm text-zinc-300 flex flex-col gap-1">
            {hypothesis.evidenceFor.map((e, i) => (
              <li key={i}><span className={STRENGTH_COLOR[e.strength]}>●</span> {e.description}</li>
            ))}
          </ul>
        </div>
      )}

      {hypothesis.evidenceAgainst.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-1">Evidências contra</p>
          <ul className="text-sm text-zinc-400 flex flex-col gap-1">
            {hypothesis.evidenceAgainst.map((e, i) => (
              <li key={i}><span className={STRENGTH_COLOR[e.strength]}>●</span> {e.description}</li>
            ))}
          </ul>
        </div>
      )}

      {hypothesis.missingData.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-1">Dados ausentes</p>
          <ul className="text-sm text-zinc-400 flex flex-col gap-1 list-disc list-inside">
            {hypothesis.missingData.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {hypothesis.nextTest && (
        <div className="bg-zinc-950 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-zinc-400">Próximo melhor teste</p>
          <p className="text-sm text-zinc-200">{hypothesis.nextTest.description}</p>
          <p className="text-xs text-zinc-500">{hypothesis.nextTest.discriminates}</p>
          <div className="flex gap-2 text-xs">
            <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300">{COST_LABEL[hypothesis.nextTest.cost]}</span>
            <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300">{SAFETY_LABEL[hypothesis.nextTest.safety]}</span>
          </div>

          {onReportTest && (
            <div className="flex flex-col gap-2 mt-1">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas do teste (opcional)"
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReportTest(hypothesis.nextTest!.id, 'confirms', notes); setNotes(''); }}
                  className="text-xs bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 px-3 py-1.5 rounded-lg"
                >
                  Confirmou
                </button>
                <button
                  onClick={() => { onReportTest(hypothesis.nextTest!.id, 'refutes', notes); setNotes(''); }}
                  className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded-lg"
                >
                  Refutou
                </button>
                <button
                  onClick={() => { onReportTest(hypothesis.nextTest!.id, 'inconclusive', notes); setNotes(''); }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg"
                >
                  Inconclusivo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {hypothesis.heuristicNote && (
        <p className="text-xs text-zinc-600 italic">{hypothesis.heuristicNote}</p>
      )}

      {hypothesis.relatedSystemId && hypothesis.relatedSystemId !== 'diagnostico' && (
        <Link
          href={`/systems/${hypothesis.relatedSystemId}`}
          className="text-xs text-cyan-400 hover:underline self-start"
        >
          Ver procedimentos do manual para este sistema →
        </Link>
      )}
    </div>
  );
}
