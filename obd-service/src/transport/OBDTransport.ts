/**
 * Abstração de transporte OBD. Uma implementação concreta (simulador ou
 * porta serial real) só precisa saber enviar uma requisição do ALLOWLIST
 * abaixo e devolver a resposta bruta em bytes. Nada além disso passa pela
 * fronteira - em particular, não existe nenhum método para enviar um
 * comando arbitrário (raw AT ou raw CAN). Isso é a barreira técnica de
 * somente-leitura: mesmo um bug de programação não consegue "escrever" no
 * veículo, porque a operação simplesmente não existe nesta interface.
 *
 * Ver obd-service/src/validation/readOnlyGuard.ts para a segunda camada de
 * defesa (allowlist explícito, verificado em runtime).
 */

/** Requisições permitidas - todas de LEITURA. Não adicione nada aqui que
 * escreva na ECU, apague DTC, controle atuador ou envie CAN arbitrário. */
export type OBDRequest =
  | { kind: 'READ_PID'; mode: '01' | '02'; pid: string }
  | { kind: 'READ_SUPPORTED_PIDS'; bank: '00' | '20' | '40' | '60' }
  | { kind: 'READ_DTC'; mode: '03' | '07' }
  | { kind: 'READ_FREEZE_FRAME' }
  | { kind: 'READ_VOLTAGE' }
  | { kind: 'READ_PROTOCOL' };

export interface OBDResponse {
  ok: boolean;
  bytes?: number[];
  error?: 'NO_RESPONSE' | 'TIMEOUT' | 'UNSUPPORTED' | 'PROTOCOL_ERROR';
  /** Presente apenas na resposta de READ_FREEZE_FRAME: bytes por PID capturados no instante da falha. */
  frame?: Record<string, number[]>;
}

export type ConnectionEvent =
  | { type: 'CONNECTED'; port: string; protocol: string }
  | { type: 'DISCONNECTED'; reason: 'USER_REQUEST' | 'LOST' | 'ERROR' }
  | { type: 'ERROR'; message: string };

export interface PortDescriptor {
  path: string; // ex: "COM4" no Windows, "/dev/ttyUSB0" no Linux
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
}

/**
 * Interface de transporte. `SimulatorTransport` e `SerialTransport`
 * implementam exatamente isto - o resto do serviço (ConnectionManager,
 * gateway HTTP/WS) nunca sabe se está falando com o simulador ou com um
 * adaptador USB real.
 */
export interface OBDTransport {
  /** Lista portas candidatas (para seleção manual). Nunca fixa uma porta. */
  listPorts(): Promise<PortDescriptor[]>;

  /** Abre a conexão numa porta específica e faz o handshake do adaptador. */
  connect(port: string): Promise<void>;

  disconnect(): Promise<void>;

  isConnected(): boolean;

  /** Envia uma requisição do ALLOWLIST e aguarda a resposta (ou timeout). */
  send(request: OBDRequest): Promise<OBDResponse>;

  onEvent(listener: (event: ConnectionEvent) => void): void;
}
