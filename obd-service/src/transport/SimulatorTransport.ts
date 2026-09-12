import { OBDTransport, OBDRequest, OBDResponse, ConnectionEvent, PortDescriptor } from './OBDTransport';
import { assertReadOnly } from '../validation/readOnlyGuard';
import { SCENARIOS, DEFAULT_SCENARIO_ID, SimulatorScenario } from '../simulator/scenarios';

export interface SimulatorFaults {
  /** Se true, a próxima chamada a connect() falha como se a porta não existisse. */
  portNotFound?: boolean;
  /** Se true, toda leitura demora mais que o timeout e retorna TIMEOUT. */
  alwaysTimeout?: boolean;
  /** Se true, toda leitura retorna NO_RESPONSE (ECU não respondeu). */
  alwaysNoResponse?: boolean;
  /** Após esse número de leituras, simula perda de conexão (LOST). */
  disconnectAfterReads?: number;
}

const SIMULATED_PORT: PortDescriptor = {
  path: 'SIMULATOR',
  manufacturer: 'OBD Simulator (dados sintéticos - não é um veículo real)',
};

/**
 * Implementação de OBDTransport que não toca hardware nenhum - gera dados
 * sintéticos a partir de um cenário (ver simulator/scenarios.ts). Usada para
 * desenvolver e testar toda a pilha (gateway, frontend, agente) sem precisar
 * do carro conectado, e nos testes automatizados para exercitar timeout,
 * desconexão e dados inválidos de forma determinística.
 */
export class SimulatorTransport implements OBDTransport {
  private connected = false;
  private connectedAt = 0;
  private readCount = 0;
  private listeners: Array<(event: ConnectionEvent) => void> = [];
  private scenario: SimulatorScenario;

  constructor(scenarioId: string = DEFAULT_SCENARIO_ID, private faults: SimulatorFaults = {}) {
    this.scenario = SCENARIOS[scenarioId] ?? SCENARIOS[DEFAULT_SCENARIO_ID];
  }

  setScenario(scenarioId: string) {
    this.scenario = SCENARIOS[scenarioId] ?? this.scenario;
  }

  async listPorts(): Promise<PortDescriptor[]> {
    return [SIMULATED_PORT];
  }

  async connect(port: string): Promise<void> {
    if (this.faults.portNotFound) {
      this.emit({ type: 'ERROR', message: `Porta "${port}" não encontrada (simulado)` });
      throw new Error('PORT_NOT_FOUND');
    }
    this.connected = true;
    this.connectedAt = Date.now();
    this.readCount = 0;
    this.emit({ type: 'CONNECTED', port, protocol: 'SIMULATED_ISO_15765_4_CAN' });
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    this.emit({ type: 'DISCONNECTED', reason: 'USER_REQUEST' });
  }

  isConnected(): boolean {
    return this.connected;
  }

  onEvent(listener: (event: ConnectionEvent) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: ConnectionEvent) {
    for (const listener of this.listeners) listener(event);
  }

  async send(rawRequest: unknown): Promise<OBDResponse> {
    const request = assertReadOnly(rawRequest) as OBDRequest;

    if (!this.connected) {
      return { ok: false, error: 'NO_RESPONSE' };
    }

    this.readCount += 1;
    if (this.faults.disconnectAfterReads && this.readCount > this.faults.disconnectAfterReads) {
      this.connected = false;
      this.emit({ type: 'DISCONNECTED', reason: 'LOST' });
      return { ok: false, error: 'NO_RESPONSE' };
    }
    if (this.faults.alwaysTimeout) {
      return { ok: false, error: 'TIMEOUT' };
    }
    if (this.faults.alwaysNoResponse) {
      return { ok: false, error: 'NO_RESPONSE' };
    }

    const t = (Date.now() - this.connectedAt) / 1000;

    switch (request.kind) {
      case 'READ_PROTOCOL':
        return { ok: true, bytes: [] };
      case 'READ_VOLTAGE': {
        const bytes = this.scenario.samplePid('42', t);
        return bytes ? { ok: true, bytes } : { ok: false, error: 'UNSUPPORTED' };
      }
      case 'READ_SUPPORTED_PIDS': {
        const offset = parseInt(request.bank, 16);
        const bits = this.encodeSupportedBitmask(offset);
        return { ok: true, bytes: bits };
      }
      case 'READ_PID': {
        if (!this.scenario.supportedPids.includes(request.pid)) {
          return { ok: false, error: 'UNSUPPORTED' };
        }
        const bytes = this.scenario.samplePid(request.pid, t);
        return bytes ? { ok: true, bytes } : { ok: false, error: 'UNSUPPORTED' };
      }
      case 'READ_DTC': {
        const bytes: number[] = [];
        for (const dtcHex of this.scenario.dtcs) {
          bytes.push(parseInt(dtcHex.slice(0, 2), 16), parseInt(dtcHex.slice(2, 4), 16));
        }
        return { ok: true, bytes };
      }
      case 'READ_FREEZE_FRAME': {
        if (this.scenario.dtcs.length === 0) {
          return { ok: false, error: 'UNSUPPORTED' };
        }
        // Freeze frame = os valores no instante da falha; usamos t=0 do
        // cenário como "o momento capturado" para ter um valor estável.
        const pids = this.scenario.supportedPids;
        const frame: Record<string, number[]> = {};
        for (const pid of pids) {
          const bytes = this.scenario.samplePid(pid, 0);
          if (bytes) frame[pid] = bytes;
        }
        return { ok: true, bytes: [], frame };
      }
      default:
        return { ok: false, error: 'UNSUPPORTED' };
    }
  }

  private encodeSupportedBitmask(offset: number): number[] {
    const bytes = [0, 0, 0, 0];
    for (const pidHex of this.scenario.supportedPids) {
      const pidNum = parseInt(pidHex, 16);
      const relative = pidNum - offset - 1;
      if (relative < 0 || relative >= 32) continue;
      const byteIndex = Math.floor(relative / 8);
      const bitIndex = 7 - (relative % 8);
      bytes[byteIndex] |= 1 << bitIndex;
    }
    // O último bit do bank (PID offset+32, ex: 0x20/0x40/0x60) sinaliza "há
    // mais PIDs no próximo bank" - é um bit de continuação da descoberta,
    // independente de offset+32 em si ser um PID sensor real. Sem isto, um
    // cenário com PIDs em banks mais altos (ex: 2F, 42) nunca é descoberto,
    // porque o ConnectionManager para de escanear ao ver o bit desligado.
    const anyPidBeyondThisBank = this.scenario.supportedPids.some(hex => parseInt(hex, 16) > offset + 32);
    if (anyPidBeyondThisBank) {
      bytes[3] |= 1;
    }
    return bytes;
  }
}
