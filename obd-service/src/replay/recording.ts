// obd-service/src/replay/recording.ts
//
// Tipos de uma sessão gravada. Uma Recording é só a sequência de
// requisições/respostas OBD (já validadas pelo readOnlyGuard, ver
// RecordingTransport) e eventos de conexão observados durante uma sessão -
// nada aqui é específico do simulador nem do hardware serial, então o
// mesmo arquivo gravado com um pode ser reproduzido pelo ReplayTransport
// independente de qual transporte gerou os dados originalmente.

import { ConnectionEvent, OBDRequest, OBDResponse } from '../transport/OBDTransport';

export interface RecordedFrame {
  /** Milissegundos desde o início da gravação (connect()). */
  atMs: number;
  request: OBDRequest;
  response: OBDResponse;
}

export interface RecordedConnectionEvent {
  atMs: number;
  event: ConnectionEvent;
}

export interface Recording {
  id: string;
  label: string;
  recordedAt: string; // ISO
  port: string;
  frames: RecordedFrame[];
  connectionEvents: RecordedConnectionEvent[];
}
