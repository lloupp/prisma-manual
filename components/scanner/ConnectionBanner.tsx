'use client';

import { ConnectionState, VehicleProfile } from '../../lib/obd-client';

interface ConnectionBannerProps {
  state: ConnectionState;
  profile: VehicleProfile | null;
}

const STATE_LABELS: Record<ConnectionState, string> = {
  CONNECTED: '● PRISMA CONECTADO',
  DISCONNECTED: '○ OBD DESCONECTADO',
  CONNECTING: '○ CONECTANDO...',
  RECONNECTING: '○ RECONECTANDO...',
  ERROR: '○ ERRO NA CONEXÃO',
};

const STATE_COLORS: Record<ConnectionState, string> = {
  CONNECTED: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50',
  DISCONNECTED: 'text-zinc-400 bg-zinc-800/50 border-zinc-700',
  CONNECTING: 'text-amber-400 bg-amber-900/30 border-amber-700/50',
  RECONNECTING: 'text-amber-400 bg-amber-900/30 border-amber-700/50',
  ERROR: 'text-red-400 bg-red-900/30 border-red-700/50',
};

export default function ConnectionBanner({ state, profile }: ConnectionBannerProps) {
  return (
    <div className={`rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-3 ${STATE_COLORS[state]}`}>
      <span className="text-lg font-bold">{STATE_LABELS[state]}</span>
      {profile && (
        <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
          <span>Porta: <strong className="text-zinc-100">{profile.port}</strong></span>
          <span>Protocolo: <strong className="text-zinc-100">{profile.protocol}</strong></span>
          <span>ECU respondeu: <strong className="text-zinc-100">{profile.ecuResponded ? 'Sim' : 'Não'}</strong></span>
          <span>PIDs suportados: <strong className="text-zinc-100">{profile.supportedPids.length}</strong></span>
        </div>
      )}
    </div>
  );
}
