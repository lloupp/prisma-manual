import { ConnectionManager } from './connection/ConnectionManager';
import { SimulatorTransport } from './transport/SimulatorTransport';
import { SerialTransport } from './transport/SerialTransport';
import { OBDTransport } from './transport/OBDTransport';
import { createServer } from './gateway/server';
import { logger } from './gateway/logger';

const PORT = Number(process.env.OBD_SERVICE_PORT ?? 4405);
const TRANSPORT_MODE = process.env.OBD_TRANSPORT ?? 'simulator';

function buildTransport(): OBDTransport {
  if (TRANSPORT_MODE === 'serial') {
    logger.warn('Iniciando com transporte SERIAL (hardware real). Modo somente-leitura ativo.');
    return new SerialTransport();
  }
  logger.info('Iniciando com transporte SIMULATOR (dados sintéticos, nenhum hardware é acessado).', {
    scenario: process.env.OBD_SIMULATOR_SCENARIO ?? 'idle-healthy',
  });
  return new SimulatorTransport(process.env.OBD_SIMULATOR_SCENARIO);
}

const transport = buildTransport();
const manager = new ConnectionManager(transport);
const server = createServer(manager);

server.listen(PORT, () => {
  logger.info(`OBD Service ouvindo em http://localhost:${PORT}`, {
    transport: TRANSPORT_MODE,
    endpoints: ['/status', '/ports', '/vehicle', '/supported-pids', '/live', '/live/ws', '/dtc', '/freeze-frame', 'POST /connect', 'POST /disconnect'],
  });
});
