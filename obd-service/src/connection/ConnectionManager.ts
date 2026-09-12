import { OBDTransport, PortDescriptor } from '../transport/OBDTransport';
import { STANDARD_PIDS, PidDefinition, decodeSupportedPidsBitmask } from '../protocol/pids';
import { decodeDtcResponse, DecodedDtc } from '../protocol/dtc';
import { logger } from '../gateway/logger';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export interface VehicleProfile {
  port: string;
  protocol: string;
  ecuResponded: boolean;
  supportedPids: string[];
  discoveredAt: string;
}

export type PidReadResult =
  | { status: 'OK'; value: number; unit: string }
  | { status: 'NOT_SUPPORTED' }
  | { status: 'NO_RESPONSE' }
  | { status: 'TIMEOUT' }
  | { status: 'PROTOCOL_ERROR' };

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BACKOFF_MS = [1000, 3000, 6000];

/**
 * Orquestra uma conexão OBD: autodetecção de protocolo/PIDs, leitura,
 * reconexão com backoff. Não sabe (e não precisa saber) se o transporte por
 * baixo é o simulador ou uma porta serial real - só fala com a interface
 * OBDTransport. O frontend/gateway HTTP nunca vê comandos seriais brutos,
 * apenas os métodos desta classe.
 */
export class ConnectionManager {
  private state: ConnectionState = 'DISCONNECTED';
  private profile: VehicleProfile | null = null;
  private reconnectAttempts = 0;
  private lastError: string | null = null;

  constructor(private transport: OBDTransport) {
    transport.onEvent(event => {
      if (event.type === 'DISCONNECTED' && event.reason === 'LOST' && this.state === 'CONNECTED') {
        this.handleUnexpectedDisconnect();
      }
    });
  }

  getState(): ConnectionState {
    return this.state;
  }

  getProfile(): VehicleProfile | null {
    return this.profile;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  async listPorts(): Promise<PortDescriptor[]> {
    return this.transport.listPorts();
  }

  async connect(port: string): Promise<VehicleProfile> {
    this.state = 'CONNECTING';
    this.lastError = null;
    logger.info('OBD connection started', { port });
    try {
      await this.transport.connect(port);
    } catch (e) {
      this.state = 'ERROR';
      this.lastError = 'ADAPTADOR_NAO_ENCONTRADO';
      logger.error('OBD adapter connect failed', { port, error: String(e) });
      throw new Error('ADAPTADOR_NAO_ENCONTRADO');
    }

    logger.info('Adapter connected, discovering protocol and PIDs', { port });
    const protocolResponse = await this.transport.send({ kind: 'READ_PROTOCOL' });
    const protocol = protocolResponse.ok ? 'DETECTADO' : 'NAO_DETECTADO';

    const supportedPids = await this.discoverSupportedPids();

    this.profile = {
      port,
      protocol,
      ecuResponded: protocolResponse.ok,
      supportedPids,
      discoveredAt: new Date().toISOString(),
    };
    this.state = 'CONNECTED';
    this.reconnectAttempts = 0;
    logger.info('PID discovery completed', { port, supportedPidCount: supportedPids.length, protocol });
    return this.profile;
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.state = 'DISCONNECTED';
    this.profile = null;
    logger.info('OBD connection closed by user');
  }

  private async discoverSupportedPids(): Promise<string[]> {
    const supported: string[] = [];
    const banks: Array<'00' | '20' | '40' | '60'> = ['00', '20', '40', '60'];
    for (const bank of banks) {
      const response = await this.transport.send({ kind: 'READ_SUPPORTED_PIDS', bank });
      if (!response.ok || !response.bytes || response.bytes.length < 4) break;
      const offset = parseInt(bank, 16);
      const pidsInBank = decodeSupportedPidsBitmask(response.bytes, offset);
      supported.push(...pidsInBank);
      // Bit menos significativo do último byte indica se o próximo bank existe.
      const lastByte = response.bytes[response.bytes.length - 1];
      if ((lastByte & 1) === 0) break;
    }
    // Só reportamos como "suportado" o que a ECU realmente confirmou -
    // nunca assumimos um PID como disponível por padrão.
    return supported.filter(pid => pid in STANDARD_PIDS);
  }

  async readPid(pid: string): Promise<PidReadResult> {
    if (this.state !== 'CONNECTED' || !this.profile) {
      return { status: 'NO_RESPONSE' };
    }
    if (!this.profile.supportedPids.includes(pid)) {
      return { status: 'NOT_SUPPORTED' };
    }
    const definition: PidDefinition | undefined = STANDARD_PIDS[pid];
    if (!definition) {
      return { status: 'NOT_SUPPORTED' };
    }
    const response = await this.transport.send({ kind: 'READ_PID', mode: '01', pid });
    if (!response.ok || !response.bytes) {
      if (response.error === 'TIMEOUT') return { status: 'TIMEOUT' };
      if (response.error === 'UNSUPPORTED') return { status: 'NOT_SUPPORTED' };
      return { status: 'NO_RESPONSE' };
    }
    // Uma resposta truncada/malformada (possível em hardware serial real,
    // nunca em dados sintéticos do simulador) não pode virar um valor
    // decodificado - decode() com bytes insuficientes produziria NaN, que
    // pareceria uma leitura real. Trate como PROTOCOL_ERROR em vez disso.
    if (response.bytes.length < definition.bytes) {
      return { status: 'PROTOCOL_ERROR' };
    }
    const value = definition.decode(response.bytes);
    if (!Number.isFinite(value)) {
      return { status: 'PROTOCOL_ERROR' };
    }
    return { status: 'OK', value, unit: definition.unit };
  }

  async readAllSupportedPids(): Promise<Record<string, PidReadResult>> {
    if (!this.profile) return {};
    const results: Record<string, PidReadResult> = {};
    for (const pid of this.profile.supportedPids) {
      results[pid] = await this.readPid(pid);
    }
    return results;
  }

  async readDtc(): Promise<DecodedDtc[]> {
    if (this.state !== 'CONNECTED') return [];
    const response = await this.transport.send({ kind: 'READ_DTC', mode: '03' });
    if (!response.ok || !response.bytes) return [];
    return decodeDtcResponse(response.bytes);
  }

  async readFreezeFrame(): Promise<Record<string, PidReadResult> | null> {
    if (this.state !== 'CONNECTED') return null;
    const response = await this.transport.send({ kind: 'READ_FREEZE_FRAME' });
    if (!response.ok || !response.frame) return null;
    const results: Record<string, PidReadResult> = {};
    for (const [pid, bytes] of Object.entries(response.frame)) {
      const definition = STANDARD_PIDS[pid];
      if (!definition) continue;
      results[pid] = { status: 'OK', value: definition.decode(bytes), unit: definition.unit };
    }
    return results;
  }

  private async handleUnexpectedDisconnect() {
    this.state = 'RECONNECTING';
    logger.warn('Connection lost, retrying', { port: this.profile?.port });
    const port = this.profile?.port;
    if (!port) {
      this.state = 'DISCONNECTED';
      return;
    }
    while (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = RECONNECT_BACKOFF_MS[this.reconnectAttempts] ?? RECONNECT_BACKOFF_MS[RECONNECT_BACKOFF_MS.length - 1];
      await new Promise(resolve => setTimeout(resolve, delay));
      this.reconnectAttempts += 1;
      try {
        await this.connect(port);
        logger.info('Reconnected successfully', { port, attempt: this.reconnectAttempts });
        return;
      } catch {
        logger.warn('Reconnect attempt failed', { port, attempt: this.reconnectAttempts });
      }
    }
    this.state = 'DISCONNECTED';
    this.lastError = 'CONEXAO_PERDIDA';
    logger.error('Reconnect attempts exhausted, giving up', { port });
  }
}
