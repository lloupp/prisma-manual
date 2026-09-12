'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plug, PlugZap, RefreshCw } from 'lucide-react';
import {
  ConnectionState,
  VehicleProfile,
  PortDescriptor,
  PidReading,
  DtcEntry,
  getStatus,
  listPorts,
  connect as obdConnect,
  disconnect as obdDisconnect,
  getDtc,
  getFreezeFrame,
  getLiveWebSocketUrl,
  OBDServiceUnavailableError,
} from '../../lib/obd-client';
import ConnectionBanner from '../../components/scanner/ConnectionBanner';
import LiveDataGrid from '../../components/scanner/LiveDataGrid';
import DtcPanel from '../../components/scanner/DtcPanel';
import LiveChart, { ChartSample } from '../../components/scanner/LiveChart';

const CHART_PIDS: Array<{ pid: string; label: string; color: string }> = [
  { pid: '0C', label: 'RPM', color: '#22d3ee' },
  { pid: '05', label: 'Temperatura do arrefecimento (°C)', color: '#fb923c' },
  { pid: '42', label: 'Tensão da ECU (V)', color: '#a78bfa' },
  { pid: '06', label: 'STFT Banco 1 (%)', color: '#34d399' },
  { pid: '07', label: 'LTFT Banco 1 (%)', color: '#f87171' },
];

const WINDOW_OPTIONS = [
  { label: '30s', ms: 30_000 },
  { label: '1 min', ms: 60_000 },
  { label: '5 min', ms: 5 * 60_000 },
  { label: 'Sessão completa', ms: Number.POSITIVE_INFINITY },
];

export default function ScannerPage() {
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [state, setState] = useState<ConnectionState>('DISCONNECTED');
  const [profile, setProfile] = useState<VehicleProfile | null>(null);
  const [ports, setPorts] = useState<PortDescriptor[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, PidReading>>({});
  const [dtcs, setDtcs] = useState<DtcEntry[]>([]);
  const [freezeFrame, setFreezeFrame] = useState<Record<string, PidReading> | null>(null);
  const [windowMs, setWindowMs] = useState(WINDOW_OPTIONS[1].ms);
  const [samples, setSamples] = useState<Record<string, ChartSample[]>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getStatus();
      setServiceAvailable(true);
      setState(status.state);
      setProfile(status.profile);
    } catch (e) {
      setServiceAvailable(false);
    }
  }, []);

  // Busca o status/portas ao montar. As atualizações de estado acontecem
  // dentro do .then()/.catch(), nunca de forma síncrona no corpo do efeito.
  useEffect(() => {
    let ignore = false;
    getStatus()
      .then(status => {
        if (ignore) return;
        setServiceAvailable(true);
        setState(status.state);
        setProfile(status.profile);
      })
      .catch(() => { if (!ignore) setServiceAvailable(false); });
    listPorts().then(list => { if (!ignore) setPorts(list); }).catch(() => {});
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (state !== 'CONNECTED') {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }
    const ws = new WebSocket(getLiveWebSocketUrl());
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'LIVE_DATA') {
          setLive(message.pids);
          const t = Date.now();
          setSamples(prev => {
            const next = { ...prev };
            for (const chart of CHART_PIDS) {
              const reading = message.pids[chart.pid];
              if (reading?.status === 'OK') {
                next[chart.pid] = [...(prev[chart.pid] ?? []), { t, value: reading.value }].slice(-1000);
              }
            }
            return next;
          });
        }
      } catch {
        // Mensagem não reconhecida - ignorada, nunca tratada como dado válido.
      }
    };
    return () => ws.close();
  }, [state]);

  useEffect(() => {
    if (state !== 'CONNECTED') return;
    let ignore = false;
    getDtc().then(list => { if (!ignore) setDtcs(list); }).catch(() => { if (!ignore) setDtcs([]); });
    getFreezeFrame().then(frame => { if (!ignore) setFreezeFrame(frame); }).catch(() => { if (!ignore) setFreezeFrame(null); });
    return () => { ignore = true; };
  }, [state]);

  const handleConnect = async () => {
    setConnectError(null);
    setState('CONNECTING');
    try {
      const port = selectedPort || ports[0]?.path;
      if (!port) throw new Error('NENHUMA_PORTA_DISPONIVEL');
      sessionStartRef.current = new Date().toISOString();
      setSamples({});
      const newProfile = await obdConnect(port);
      setProfile(newProfile);
      setState('CONNECTED');
    } catch (e) {
      setState('ERROR');
      setConnectError(describeConnectError(e));
    }
  };

  const handleDisconnect = async () => {
    if (profile && sessionStartRef.current) {
      await fetch('/api/diagnostic-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `session-${Date.now()}`,
          startedAt: sessionStartRef.current,
          endedAt: new Date().toISOString(),
          port: profile.port,
          protocol: profile.protocol,
          ecuResponded: profile.ecuResponded,
          supportedPids: profile.supportedPids,
          dtcs,
          freezeFrame,
          finalSamples: live,
        }),
      }).catch(() => {
        // Falha ao salvar o histórico não deve impedir a desconexão real.
      });
    }
    await obdDisconnect().catch(() => {});
    setState('DISCONNECTED');
    setProfile(null);
    setLive({});
  };

  if (serviceAvailable === false) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <BackLink />
        <div className="bg-amber-900/20 border border-amber-900/30 rounded-xl p-6">
          <h1 className="text-xl font-bold text-amber-200 mb-2">OBD Service não encontrado</h1>
          <p className="text-zinc-300 text-sm mb-3">
            O Scanner precisa do OBD Service rodando localmente (processo separado, não é parte do
            servidor Next.js). Abra um terminal e execute:
          </p>
          <pre className="bg-zinc-950 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">
{`cd obd-service
npm install   # primeira vez
npm run dev`}
          </pre>
          <button
            onClick={refreshStatus}
            className="mt-4 inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <BackLink />

      <ConnectionBanner state={state} profile={profile} />

      {state !== 'CONNECTED' && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-100">Conectar ao carro</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedPort}
              onChange={e => setSelectedPort(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">Selecione a porta...</option>
              {ports.map(p => (
                <option key={p.path} value={p.path}>
                  {p.path}{p.manufacturer ? ` — ${p.manufacturer}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => listPorts().then(setPorts)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-400"
            >
              <RefreshCw size={13} /> Atualizar portas
            </button>
            <button
              onClick={handleConnect}
              disabled={state === 'CONNECTING'}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plug size={15} /> {state === 'CONNECTING' ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
          {connectError && <p className="text-red-400 text-sm">{connectError}</p>}
          <p className="text-zinc-500 text-xs">
            Nunca fixamos uma porta - a lista acima vem do sistema operacional. No Windows, o
            adaptador normalmente aparece como COM3, COM4 etc.
          </p>
        </div>
      )}

      {state === 'CONNECTED' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm"
            >
              <PlugZap size={15} /> Desconectar
            </button>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3">Dados ao Vivo</h2>
            <LiveDataGrid pids={live} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Gráficos</h2>
              <div className="flex gap-2">
                {WINDOW_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setWindowMs(opt.ms)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      windowMs === opt.ms
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {CHART_PIDS.filter(c => live[c.pid]?.status === 'OK' || (samples[c.pid]?.length ?? 0) > 0).map(chart => (
                <LiveChart
                  key={chart.pid}
                  label={chart.label}
                  unit={live[chart.pid]?.status === 'OK' ? (live[chart.pid] as { unit: string }).unit : ''}
                  samples={samples[chart.pid] ?? []}
                  windowMs={windowMs === Number.POSITIVE_INFINITY ? 24 * 60 * 60_000 : windowMs}
                  color={chart.color}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Códigos de Falha (DTC)</h2>
            <DtcPanel dtcs={dtcs} freezeFrame={freezeFrame} />
          </section>
        </>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <nav className="flex items-center gap-2 text-sm text-zinc-400">
      <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
        <ArrowLeft size={16} />
        Manual
      </Link>
      <span>/</span>
      <span className="text-zinc-200">Scanner OBD</span>
    </nav>
  );
}

function describeConnectError(e: unknown): string {
  if (e instanceof OBDServiceUnavailableError) return e.message;
  const message = e instanceof Error ? e.message : String(e);
  const known: Record<string, string> = {
    NENHUMA_PORTA_DISPONIVEL: 'Nenhuma porta encontrada. Verifique se o adaptador está conectado.',
    ADAPTADOR_NAO_ENCONTRADO: 'Adaptador não encontrado nesta porta.',
    PORT_NOT_FOUND: 'Porta não encontrada.',
  };
  return known[message] ?? `Erro na conexão: ${message}`;
}
