import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { getDiagnosticSessions } from '../../lib/selectors';

export const metadata: Metadata = {
  title: 'Histórico do Veículo',
  description: 'Sessões de diagnóstico OBD anteriores do Chevrolet Prisma - prontuário do veículo.',
};

// Esta página lê sessões novas a cada visita (o usuário acabou de conectar
// o carro). Sem isto, o Next.js otimiza a rota como estática (nenhuma API
// dinâmica é usada) e serve o HTML gerado em build time para sempre -
// mostrando "nenhuma sessão" mesmo depois de sessões reais existirem.
export const dynamic = 'force-dynamic';

function formatDuration(start: Date, end: Date | null) {
  if (!end) return '—';
  const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}min`;
}

export default async function HistoricoPage() {
  const sessions = await getDiagnosticSessions();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
          <ArrowLeft size={16} />
          Manual
        </Link>
        <span>/</span>
        <span className="text-zinc-200">Histórico</span>
      </nav>

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h1 className="text-3xl font-bold mb-2">Histórico do Veículo</h1>
        <p className="text-zinc-400">
          Sessões de diagnóstico OBD registradas pelo <Link href="/scanner" className="text-cyan-400 hover:underline">Scanner</Link>.
          Cada sessão guarda o que foi lido do carro no momento da conexão - nenhum dado aqui é
          histórico de manutenção preditivo ou uma conclusão automática, apenas o registro bruto.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center text-zinc-400">
          Nenhuma sessão registrada ainda. Conecte o Scanner ao carro para começar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map(session => (
            <div key={session.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock size={14} />
                  {new Date(session.startedAt).toLocaleString('pt-BR')}
                  <span className="text-zinc-600">·</span>
                  <span>{formatDuration(new Date(session.startedAt), session.endedAt ? new Date(session.endedAt) : null)}</span>
                </div>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">{session.port}</span>
              </div>
              {session.dtcs.length > 0 ? (
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <AlertTriangle size={14} />
                  {session.dtcs.map((d: { code: string }) => d.code).join(', ')}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Nenhum DTC nesta sessão.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
