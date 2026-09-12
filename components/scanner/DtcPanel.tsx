'use client';

import { AlertTriangle } from 'lucide-react';
import { DtcEntry, PidReading } from '../../lib/obd-client';

interface DtcPanelProps {
  dtcs: DtcEntry[];
  freezeFrame: Record<string, PidReading> | null;
}

export default function DtcPanel({ dtcs, freezeFrame }: DtcPanelProps) {
  if (dtcs.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 text-zinc-400 text-sm">
        Nenhum código de falha armazenado no momento.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dtcs.map(dtc => (
        <div key={dtc.code} className="bg-red-900/20 rounded-xl border border-red-900/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-400" size={20} />
            <span className="font-mono text-lg font-bold text-red-300">{dtc.code}</span>
          </div>
          <p className="text-zinc-300 text-sm">
            {dtc.description ?? 'Descrição não confirmada por documentação técnica nesta pesquisa.'}
          </p>
          <p className="text-zinc-500 text-xs mt-2">
            A existência deste código não implica, por si só, qual peça deve ser trocada. Use o
            freeze frame e os dados ao vivo para investigar antes de qualquer troca de peça.
          </p>
        </div>
      ))}

      {freezeFrame && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <h3 className="font-semibold text-zinc-100 mb-3">Freeze Frame (momento da falha)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(freezeFrame)
              .filter(([, r]) => r.status === 'OK')
              .map(([pid, reading]) => (
                <div key={pid} className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">{reading.name ?? pid}</p>
                  <p className="text-zinc-100 font-mono font-medium">
                    {reading.status === 'OK' ? `${reading.value.toFixed(1)} ${reading.unit}` : '—'}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
