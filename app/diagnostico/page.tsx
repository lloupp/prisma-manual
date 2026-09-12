'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plug, PlugZap, RefreshCw, Save, History } from 'lucide-react';
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
  getLive,
  getDtc,
  getFreezeFrame,
  OBDServiceUnavailableError,
} from '../../lib/obd-client';
import { runDiagnostics } from '../../lib/diagnostics/engine';
import { buildSampleFromLiveData } from '../../lib/diagnostics/fromLiveData';
import { DiagnosticSample, ReportedTestResult } from '../../lib/diagnostics/types';
import ConnectionBanner from '../../components/scanner/ConnectionBanner';
import LiveDataGrid from '../../components/scanner/LiveDataGrid';
import ScenarioPicker from '../../components/diagnostico/ScenarioPicker';
import HypothesisList from '../../components/diagnostico/HypothesisList';

const SAMPLE_LABELS: Array<{ label: DiagnosticSample['label']; text: string }> = [
  { label: 'idle', text: 'Capturar em marcha lenta' },
  { label: 'higher_rpm', text: 'Capturar em rotação mais alta' },
  { label: 'cold_start', text: 'Capturar em partida a frio' },
  { label: 'warm', text: 'Capturar com motor quente' },
];

export default function DiagnosticoPage() {
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [state, setState] = useState<ConnectionState>('DISCONNECTED');
  const [profile, setProfile] = useState<VehicleProfile | null>(null);
  const [ports, setPorts] = useState<PortDescriptor[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, PidReading>>({});
  const [dtcs, setDtcs] = useState<DtcEntry[]>([]);
  const [freezeFrame, setFreezeFrame] = useState<Record<string, PidReading> | null>(null);

  const [symptom, setSymptom] = useState('');
  const [diagnosisStarted, setDiagnosisStarted] = useState(false);
  const [samplesByLabel, setSamplesByLabel] = useState<Partial<Record<DiagnosticSample['label'], DiagnosticSample>>>({});
  const [reportedTests, setReportedTests] = useState<ReportedTestResult[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const sessionStartRef = useRef<string | null>(null);

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
    if (state !== 'CONNECTED') return;
    let ignore = false;
    getLive().then(pids => { if (!ignore) setLive(pids); }).catch(() => {});
    const interval = setInterval(() => {
      getLive().then(pids => { if (!ignore) setLive(pids); }).catch(() => {});
    }, 2000);
    getDtc().then(list => { if (!ignore) setDtcs(list); }).catch(() => {});
    getFreezeFrame().then(frame => { if (!ignore) setFreezeFrame(frame); }).catch(() => {});
    return () => { ignore = true; clearInterval(interval); };
  }, [state]);

  const samples = useMemo(() => Object.values(samplesByLabel).filter((s): s is DiagnosticSample => !!s), [samplesByLabel]);

  const report = useMemo(() => {
    if (!diagnosisStarted) return null;
    return runDiagnostics({ symptom, dtcs, samples, reportedTests });
  }, [diagnosisStarted, symptom, dtcs, samples, reportedTests]);

  const handleConnect = async () => {
    setConnectError(null);
    setState('CONNECTING');
    try {
      const port = selectedPort || ports[0]?.path;
      if (!port) throw new Error('NENHUMA_PORTA_DISPONIVEL');
      sessionStartRef.current = new Date().toISOString();
      const newProfile = await obdConnect(port);
      setProfile(newProfile);
      setState('CONNECTED');
    } catch (e) {
      setState('ERROR');
      setConnectError(describeConnectError(e));
    }
  };

  const handleDisconnect = async () => {
    await obdDisconnect().catch(() => {});
    setState('DISCONNECTED');
    setProfile(null);
    setLive({});
  };

  const handleCaptureSample = async (label: DiagnosticSample['label']) => {
    const freshLive = await getLive().catch(() => live);
    setSamplesByLabel(prev => ({ ...prev, [label]: buildSampleFromLiveData(freshLive, label) }));
  };

  const handleReportTest = (testId: string, outcome: ReportedTestResult['outcome'], notes: string) => {
    setReportedTests(prev => [...prev, { testId, outcome, notes: notes.trim() || undefined }]);
  };

  const handleSaveSession = async () => {
    if (!profile || !sessionStartRef.current) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/diagnostic-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `diagnostico-${Date.now()}`,
          startedAt: sessionStartRef.current,
          endedAt: new Date().toISOString(),
          port: profile.port,
          protocol: profile.protocol,
          ecuResponded: profile.ecuResponded,
          supportedPids: profile.supportedPids,
          dtcs,
          freezeFrame,
          finalSamples: live,
          symptomsReported: symptom || undefined,
          diagnosticSamples: samples,
          reportedTests,
          hypothesesSnapshot: report,
        }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
  };

  if (serviceAvailable === false) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <BackLink />
        <div className="bg-amber-900/20 border border-amber-900/30 rounded-xl p-6">
          <h1 className="text-xl font-bold text-amber-200 mb-2">OBD Service não encontrado</h1>
          <p className="text-zinc-300 text-sm mb-3">
            O Diagnóstico precisa do OBD Service rodando localmente. Abra um terminal e execute:
          </p>
          <pre className="bg-zinc-950 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">
{`cd obd-service
npm install   # primeira vez
npm run dev`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <BackLink />

      <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
        <h1 className="text-2xl font-bold mb-1">Diagnóstico assistido</h1>
        <p className="text-zinc-400 text-sm">
          Raciocínio por hipóteses (SINTOMA → DADOS → HIPÓTESES → EVIDÊNCIAS → PRÓXIMO TESTE).
          Nunca recomenda trocar uma peça direto - sempre pede o teste mais barato e seguro que
          ajudaria a confirmar ou descartar cada hipótese. O motor é determinístico (regras, sem
          IA generativa conectada nesta fase) - ver <Link href="/historico" className="text-cyan-400 hover:underline">histórico</Link> para sessões salvas.
        </p>
      </div>

      <ConnectionBanner state={state} profile={profile} />

      {state !== 'CONNECTED' && (
        <>
          <ScenarioPicker />
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-3">
            <h2 className="font-semibold text-zinc-100">2. Conectar ao carro</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Selecionar porta"
                value={selectedPort}
                onChange={e => setSelectedPort(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
              >
                <option value="">Selecione a porta...</option>
                {ports.map(p => (
                  <option key={p.path} value={p.path}>{p.path}{p.manufacturer ? ` — ${p.manufacturer}` : ''}</option>
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
          </div>
        </>
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
            <h2 className="text-xl font-semibold mb-3">3. Dados ao vivo</h2>
            <LiveDataGrid pids={live} />
          </section>

          {!diagnosisStarted ? (
            <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-3">
              <h2 className="font-semibold text-zinc-100">4. Iniciar diagnóstico</h2>
              <textarea
                value={symptom}
                onChange={e => setSymptom(e.target.value)}
                placeholder="Descreva o sintoma (ex.: motor morre em marcha lenta quando está frio)"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 resize-none"
                rows={3}
              />
              <button
                onClick={() => setDiagnosisStarted(true)}
                disabled={!symptom.trim()}
                className="self-start inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Iniciar diagnóstico
              </button>
            </section>
          ) : (
            <>
              <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-3">
                <h2 className="font-semibold text-zinc-100">5. Coletar amostras rotuladas</h2>
                <p className="text-zinc-500 text-xs">Sintoma: {symptom}</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_LABELS.map(({ label, text }) => (
                    <button
                      key={label}
                      onClick={() => handleCaptureSample(label)}
                      className={`text-xs px-3 py-2 rounded-lg border ${
                        samplesByLabel[label]
                          ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-cyan-600'
                      }`}
                    >
                      {samplesByLabel[label] ? '✓ ' : ''}{text}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6-8. Hipóteses e próximo teste</h2>
                {report && <HypothesisList report={report} onReportTest={handleReportTest} />}
              </section>

              <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSaveSession}
                  disabled={saveStatus === 'saving'}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 px-4 py-2 rounded-lg text-sm"
                >
                  <Save size={15} /> {saveStatus === 'saving' ? 'Salvando...' : '11. Salvar sessão'}
                </button>
                {saveStatus === 'saved' && <span className="text-emerald-400 text-xs">Sessão salva.</span>}
                {saveStatus === 'error' && <span className="text-red-400 text-xs">Falha ao salvar.</span>}
                <Link
                  href="/historico"
                  className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:underline ml-auto"
                >
                  <History size={14} /> 12. Ver/reabrir sessões salvas
                </Link>
              </section>
            </>
          )}
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
      <span className="text-zinc-200">Diagnóstico</span>
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
