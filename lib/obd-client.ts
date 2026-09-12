// lib/obd-client.ts
// Cliente para o OBD Service local (processo separado, ver obd-service/).
// Funciona tanto no navegador quanto no servidor (Node) do Next.js, desde
// que o serviço esteja rodando na mesma máquina - é exatamente o cenário
// deste projeto (usuário roda tudo no próprio notebook, ao lado do carro).
//
// Nunca envie comandos brutos por aqui: os únicos endpoints existentes são
// de leitura (ver obd-service/src/gateway/server.ts) e POST /connect,
// /disconnect - não existe um endpoint genérico de "enviar comando".

const DEFAULT_BASE_URL = 'http://localhost:4405';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_OBD_SERVICE_URL || DEFAULT_BASE_URL;
}

export interface PortDescriptor {
  path: string;
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
}

export interface VehicleProfile {
  port: string;
  protocol: string;
  ecuResponded: boolean;
  supportedPids: string[];
  discoveredAt: string;
}

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export interface StatusResponse {
  state: ConnectionState;
  profile: VehicleProfile | null;
  lastError: string | null;
}

export type PidReading =
  | { status: 'OK'; value: number; unit: string; name?: string; shortName?: string }
  | { status: 'STALE'; value: number; unit: string; name?: string; shortName?: string }
  | { status: 'NOT_SUPPORTED'; name?: string; shortName?: string }
  | { status: 'NO_RESPONSE'; name?: string; shortName?: string }
  | { status: 'TIMEOUT'; name?: string; shortName?: string }
  | { status: 'PROTOCOL_ERROR'; name?: string; shortName?: string };

export interface DtcEntry {
  code: string;
  description: string | null;
}

class OBDServiceUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Não foi possível falar com o OBD Service local. Ele está rodando? (obd-service, npm run dev)');
    this.name = 'OBDServiceUnavailableError';
    this.cause = cause;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}${path}`, { ...init, cache: 'no-store' });
  } catch (e) {
    throw new OBDServiceUnavailableError(e);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = (body as { error?: string }).error ?? `HTTP_${res.status}`;
    throw new Error(error);
  }
  return body as T;
}

export async function getStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/status');
}

export async function listPorts(): Promise<PortDescriptor[]> {
  const { ports } = await request<{ ports: PortDescriptor[] }>('/ports');
  return ports;
}

export async function connect(port: string): Promise<VehicleProfile> {
  const { profile } = await request<{ profile: VehicleProfile }>('/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ port }),
  });
  return profile;
}

export async function disconnect(): Promise<void> {
  await request('/disconnect', { method: 'POST' });
}

export async function getLive(): Promise<Record<string, PidReading>> {
  const { pids } = await request<{ pids: Record<string, PidReading> }>('/live');
  return pids;
}

export async function getDtc(): Promise<DtcEntry[]> {
  const { dtcs } = await request<{ dtcs: DtcEntry[] }>('/dtc');
  return dtcs;
}

export async function getFreezeFrame(): Promise<Record<string, PidReading> | null> {
  try {
    const { frame } = await request<{ frame: Record<string, PidReading> }>('/freeze-frame');
    return frame;
  } catch (e) {
    if (e instanceof Error && e.message === 'SEM_FREEZE_FRAME') return null;
    throw e;
  }
}

export function getLiveWebSocketUrl(): string {
  return `${getBaseUrl().replace('http', 'ws')}/live/ws`;
}

export interface SimulatorScenarioDescriptor {
  id: string;
  label: string;
  description: string;
}

/** Lista os cenários do simulador disponíveis. Só retorna algo quando o OBD
 * Service está rodando com o transporte SIMULATOR - com hardware real
 * (SERIAL) o endpoint não existe (404). */
export async function listSimulatorScenarios(): Promise<SimulatorScenarioDescriptor[]> {
  const { scenarios } = await request<{ scenarios: SimulatorScenarioDescriptor[] }>('/simulator/scenarios');
  return scenarios;
}

/** Troca o cenário ativo do simulador em tempo real, sem precisar
 * reiniciar o OBD Service. Sem efeito (e sem sentido) com hardware real. */
export async function setSimulatorScenario(scenarioId: string): Promise<void> {
  await request('/simulator/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId }),
  });
}

export interface RecordingFileDescriptor {
  fileName: string;
  id: string;
  label: string;
  recordedAt: string;
  frameCount: number;
}

/** Quantos quadros já foram gravados na sessão atual (desde o connect()
 * ou desde a última chamada de saveCurrentRecording()). */
export async function getCurrentRecordingStatus(): Promise<{ frameCount: number }> {
  return request<{ frameCount: number }>('/recording/current');
}

/** Salva a gravação da sessão atual em disco no OBD Service - o "SAVE" do
 * ciclo RECORD -> SAVE -> REPLAY. Para reproduzir depois (REPLAY), o OBD
 * Service precisa ser reiniciado com OBD_TRANSPORT=replay e
 * OBD_REPLAY_FILE apontando para o arquivo salvo (ver obd-service/README.md) -
 * o front-end não troca o transporte em tempo real. */
export async function saveCurrentRecording(label?: string): Promise<{ fileName: string; id: string; frameCount: number }> {
  return request('/recording/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
}

/** Lista as sessões já salvas em disco no OBD Service. */
export async function listSavedRecordings(): Promise<RecordingFileDescriptor[]> {
  const { recordings } = await request<{ recordings: RecordingFileDescriptor[] }>('/recording/list');
  return recordings;
}

export { OBDServiceUnavailableError };
