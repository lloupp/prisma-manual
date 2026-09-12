import { randomUUID } from 'node:crypto';
import { OBDTransport, OBDRequest, OBDResponse, ConnectionEvent, PortDescriptor } from './OBDTransport';
import { Recording, RecordedFrame, RecordedConnectionEvent } from '../replay/recording';

/**
 * Decorator de OBDTransport: encaminha toda chamada para um transporte
 * interno (simulador ou serial - não importa qual) e grava cada
 * requisição/resposta e evento de conexão, com o tempo relativo ao
 * connect(). Implementa a própria OBDTransport, então pode substituir
 * diretamente o transporte "cru" em qualquer lugar que já use a
 * interface - ConnectionManager e o gateway HTTP nunca precisam saber que
 * a gravação está acontecendo.
 *
 * Isto é só o "RECORD" do ciclo RECORD -> SAVE -> REPLAY: a gravação em si
 * fica em memória (getRecording()) até alguém pedir para salvá-la em
 * disco (ver replay/storage.ts) - ver ReplayTransport para o "REPLAY".
 */
export class RecordingTransport implements OBDTransport {
  private startedAt = 0;
  private frames: RecordedFrame[] = [];
  private connectionEvents: RecordedConnectionEvent[] = [];
  private listeners: Array<(event: ConnectionEvent) => void> = [];
  private port = '';

  constructor(private inner: OBDTransport, private label = 'Sessão gravada') {
    this.inner.onEvent(event => {
      this.connectionEvents.push({ atMs: this.elapsed(), event });
      for (const listener of this.listeners) listener(event);
    });
  }

  private elapsed(): number {
    return this.startedAt ? Date.now() - this.startedAt : 0;
  }

  async listPorts(): Promise<PortDescriptor[]> {
    return this.inner.listPorts();
  }

  async connect(port: string): Promise<void> {
    this.startedAt = Date.now();
    this.port = port;
    await this.inner.connect(port);
  }

  async disconnect(): Promise<void> {
    await this.inner.disconnect();
  }

  isConnected(): boolean {
    return this.inner.isConnected();
  }

  onEvent(listener: (event: ConnectionEvent) => void): void {
    this.listeners.push(listener);
  }

  async send(request: OBDRequest): Promise<OBDResponse> {
    const response = await this.inner.send(request);
    this.frames.push({ atMs: this.elapsed(), request, response });
    return response;
  }

  /** Quantos quadros já foram gravados nesta sessão. */
  getFrameCount(): number {
    return this.frames.length;
  }

  /** Snapshot da gravação atual - não limpa o buffer, então pode ser
   * chamado a qualquer momento sem perder o que já foi gravado. */
  getRecording(): Recording {
    return {
      id: randomUUID(),
      label: this.label,
      recordedAt: new Date().toISOString(),
      port: this.port,
      frames: [...this.frames],
      connectionEvents: [...this.connectionEvents],
    };
  }

  /** Descarta os quadros gravados até agora, mantendo a conexão ativa -
   * útil para começar a gravar um novo trecho sem reconectar. */
  clear(): void {
    this.frames = [];
    this.connectionEvents = [];
    this.startedAt = Date.now();
  }
}
