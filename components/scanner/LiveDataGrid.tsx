'use client';

import { PidReading } from '../../lib/obd-client';

interface LiveDataGridProps {
  pids: Record<string, PidReading>;
}

const STATUS_LABELS: Record<string, string> = {
  NOT_SUPPORTED: 'NÃO SUPORTADO',
  NO_RESPONSE: 'SEM RESPOSTA',
  TIMEOUT: 'TEMPO ESGOTADO',
  PROTOCOL_ERROR: 'RESPOSTA INVÁLIDA',
  STALE: 'DADO OBSOLETO',
};

function formatValue(reading: PidReading): string {
  if (reading.status !== 'OK') return '—';
  // Uma casa decimal é suficiente para leitura em oficina; nunca arredonda
  // para "0" quando o valor real é pequeno mas diferente de zero.
  return reading.value.toFixed(reading.unit === '%' || reading.unit === 'V' ? 1 : 0);
}

export default function LiveDataGrid({ pids }: LiveDataGridProps) {
  const supported = Object.entries(pids).filter(([, r]) => r.status === 'OK');
  const unsupportedOrFailed = Object.entries(pids).filter(([, r]) => r.status !== 'OK');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {supported.map(([pid, reading]) => (
          <div key={pid} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-1">
            <span className="text-xs text-zinc-500">{reading.name ?? pid}</span>
            <span className="text-2xl font-bold text-cyan-400 font-mono">
              {formatValue(reading)}
              <span className="text-sm text-zinc-500 ml-1">{reading.status === 'OK' ? reading.unit : ''}</span>
            </span>
          </div>
        ))}
      </div>

      {unsupportedOrFailed.length > 0 && (
        <details className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <summary className="text-sm text-zinc-500 cursor-pointer">
            {unsupportedOrFailed.length} parâmetro(s) sem leitura no momento
          </summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
            {unsupportedOrFailed.map(([pid, reading]) => (
              <div key={pid} className="text-xs text-zinc-500 flex items-center justify-between bg-zinc-800/50 rounded px-2 py-1.5">
                <span>{reading.name ?? pid}</span>
                <span className="text-zinc-600 font-medium">{STATUS_LABELS[reading.status] ?? reading.status}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
