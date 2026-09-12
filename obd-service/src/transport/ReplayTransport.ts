import { OBDTransport, OBDRequest, OBDResponse, ConnectionEvent, PortDescriptor } from './OBDTransport';
import { assertReadOnly } from '../validation/readOnlyGuard';
import { Recording } from '../replay/recording';

function requestKey(request: OBDRequest): string {
  switch (request.kind) {
    case 'READ_PID': return `READ_PID:${request.pid}`;
    case 'READ_SUPPORTED_PIDS': return `READ_SUPPORTED_PIDS:${request.bank}`;
    case 'READ_DTC': return 'READ_DTC';
    case 'READ_FREEZE_FRAME': return 'READ_FREEZE_FRAME';
    case 'READ_VOLTAGE': return 'READ_VOLTAGE';
    case 'READ_PROTOCOL': return 'READ_PROTOCOL';
  }
}

/**
 * Implementação de OBDTransport que não toca hardware nenhum e não gera
 * dados sintéticos on-the-fly (diferente do SimulatorTransport) - ela
 * reproduz exatamente a sequência de respostas de uma Recording
 * previamente gravada de uma sessão real ou simulada (ver
 * RecordingTransport / replay/storage.ts). Serve para revisar um caso de
 * diagnóstico depois, sem precisar do veículo (ou do simulador) de novo, e
 * para reproduzir bugs de forma determinística.
 *
 * Cada tipo de requisição (ex.: "READ_PID:0C") tem sua própria fila de
 * respostas gravadas, reproduzidas na ordem original - isso permite que o
 * ConnectionManager funcione exatamente como funcionaria com o transporte
 * original, mesmo que ele intercale chamadas de tipos diferentes. Quando a
 * fila de um tipo se esgota, a última resposta conhecida é repetida, mas
 * marcada como `stale: true` - a gravação acabou, então nunca finge ser
 * uma leitura fresca (ver ConnectionManager.readPid()).
 */
export class ReplayTransport implements OBDTransport {
  private connected = false;
  private listeners: Array<(event: ConnectionEvent) => void> = [];
  private queues: Map<string, OBDResponse[]>;
  private lastByKey: Map<string, OBDResponse> = new Map();

  constructor(private recording: Recording) {
    this.queues = new Map();
    for (const frame of recording.frames) {
      const key = requestKey(frame.request);
      const queue = this.queues.get(key) ?? [];
      queue.push(frame.response);
      this.queues.set(key, queue);
    }
  }

  async listPorts(): Promise<PortDescriptor[]> {
    return [{
      path: this.recording.port || 'REPLAY',
      manufacturer: `Replay: ${this.recording.label} (dados gravados - não é um veículo real)`,
    }];
  }

  async connect(port: string): Promise<void> {
    this.connected = true;
    this.emit({ type: 'CONNECTED', port, protocol: 'REPLAY' });
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

    const key = requestKey(request);
    const queue = this.queues.get(key);
    if (queue && queue.length > 0) {
      const response = queue.shift()!;
      this.lastByKey.set(key, response);
      return response;
    }

    const last = this.lastByKey.get(key);
    if (last) {
      return { ...last, stale: true };
    }

    // Esta requisição nunca foi gravada nesta sessão - nunca inventa uma
    // resposta plausível, trata como PID/comando não suportado.
    return { ok: false, error: 'UNSUPPORTED' };
  }
}
