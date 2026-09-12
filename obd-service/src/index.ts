import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConnectionManager } from './connection/ConnectionManager';
import { SimulatorTransport } from './transport/SimulatorTransport';
import { SerialTransport } from './transport/SerialTransport';
import { ReplayTransport } from './transport/ReplayTransport';
import { RecordingTransport } from './transport/RecordingTransport';
import { OBDTransport } from './transport/OBDTransport';
import { loadRecordingFromFile } from './replay/storage';
import { createServer } from './gateway/server';
import { logger } from './gateway/logger';

const PORT = Number(process.env.OBD_SERVICE_PORT ?? 4405);
const TRANSPORT_MODE = process.env.OBD_TRANSPORT ?? 'simulator';
// Este pacote é ESM ("type": "module" no package.json) - __dirname não
// existe; o equivalente é derivar o diretório a partir de import.meta.url.
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const RECORDINGS_DIR = process.env.OBD_RECORDINGS_DIR ?? join(MODULE_DIR, '..', 'recordings');

function buildTransport(): OBDTransport {
  if (TRANSPORT_MODE === 'serial') {
    logger.warn('Iniciando com transporte SERIAL (hardware real). Modo somente-leitura ativo.');
    return new SerialTransport();
  }
  if (TRANSPORT_MODE === 'replay') {
    const file = process.env.OBD_REPLAY_FILE;
    if (!file) {
      throw new Error('OBD_TRANSPORT=replay exige OBD_REPLAY_FILE apontando para uma gravação (.json)');
    }
    const recording = loadRecordingFromFile(file);
    logger.info('Iniciando com transporte REPLAY (reproduzindo sessão gravada, nenhum hardware é acessado).', {
      file, label: recording.label, frameCount: recording.frames.length,
    });
    return new ReplayTransport(recording);
  }
  logger.info('Iniciando com transporte SIMULATOR (dados sintéticos, nenhum hardware é acessado).', {
    scenario: process.env.OBD_SIMULATOR_SCENARIO ?? 'idle-healthy',
  });
  return new SimulatorTransport(process.env.OBD_SIMULATOR_SCENARIO);
}

// A gravação (RECORD do ciclo RECORD -> SAVE -> REPLAY) envolve qualquer
// transporte, simulado ou real - o ConnectionManager e o gateway HTTP só
// veem a interface OBDTransport, nunca sabem que a gravação está
// acontecendo por baixo. Ver /recording/current e /recording/save.
const rawTransport = buildTransport();
const transport = new RecordingTransport(rawTransport, `Sessão ${TRANSPORT_MODE}`);
const manager = new ConnectionManager(transport);
const server = createServer(manager, { transport: rawTransport, recorder: transport, recordingsDir: RECORDINGS_DIR });

server.listen(PORT, () => {
  logger.info(`OBD Service ouvindo em http://localhost:${PORT}`, {
    transport: TRANSPORT_MODE,
    endpoints: [
      '/status', '/ports', '/vehicle', '/supported-pids', '/live', '/live/ws', '/dtc', '/freeze-frame',
      'POST /connect', 'POST /disconnect', '/recording/current', 'POST /recording/save', '/recording/list',
      ...(TRANSPORT_MODE === 'simulator' ? ['/simulator/scenarios', 'POST /simulator/scenario'] : []),
    ],
  });
});
