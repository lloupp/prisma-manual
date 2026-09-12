import http, { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { ConnectionManager } from '../connection/ConnectionManager';
import { OBDTransport } from '../transport/OBDTransport';
import { SimulatorTransport } from '../transport/SimulatorTransport';
import { RecordingTransport } from '../transport/RecordingTransport';
import { SCENARIOS } from '../simulator/scenarios';
import { STANDARD_PIDS } from '../protocol/pids';
import { describeDtc } from '../protocol/dtcDescriptions';
import { saveRecordingToFile, listRecordingFiles } from '../replay/storage';
import { logger } from './logger';

const LIVE_STREAM_INTERVAL_MS = 1000;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function pidCatalog() {
  return Object.values(STANDARD_PIDS).map(p => ({
    pid: p.pid,
    name: p.name,
    shortName: p.shortName,
    unit: p.unit,
  }));
}

async function liveSnapshot(manager: ConnectionManager) {
  const results = await manager.readAllSupportedPids();
  return Object.fromEntries(
    Object.entries(results).map(([pid, result]) => [
      pid,
      { ...result, name: STANDARD_PIDS[pid]?.name, shortName: STANDARD_PIDS[pid]?.shortName },
    ]),
  );
}

export interface GatewayOptions {
  /** Transporte "cru" (não decorado) - usado só para checar se os
   * endpoints /simulator/* fazem sentido (instanceof SimulatorTransport). */
  transport?: OBDTransport;
  /** Decorator que grava a sessão atual - usado pelos endpoints
   * /recording/*. Ausente = gravação não está disponível nesta instância. */
  recorder?: RecordingTransport;
  /** Diretório onde POST /recording/save escreve os arquivos e GET
   * /recording/list procura por eles. */
  recordingsDir?: string;
}

export function createServer(manager: ConnectionManager, options: GatewayOptions = {}) {
  const { transport, recorder, recordingsDir } = options;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', 'http://localhost');

    try {
      if (req.method === 'GET' && url.pathname === '/status') {
        return sendJson(res, 200, {
          state: manager.getState(),
          profile: manager.getProfile(),
          lastError: manager.getLastError(),
        });
      }

      if (req.method === 'GET' && url.pathname === '/ports') {
        const ports = await manager.listPorts();
        return sendJson(res, 200, { ports });
      }

      if (req.method === 'GET' && url.pathname === '/vehicle') {
        const profile = manager.getProfile();
        if (!profile) return sendJson(res, 409, { error: 'NAO_CONECTADO' });
        return sendJson(res, 200, profile);
      }

      if (req.method === 'GET' && url.pathname === '/supported-pids') {
        const profile = manager.getProfile();
        if (!profile) return sendJson(res, 409, { error: 'NAO_CONECTADO' });
        const catalog = pidCatalog().filter(p => profile.supportedPids.includes(p.pid));
        return sendJson(res, 200, { pids: catalog });
      }

      if (req.method === 'GET' && url.pathname === '/live') {
        if (manager.getState() !== 'CONNECTED') return sendJson(res, 409, { error: 'NAO_CONECTADO' });
        const snapshot = await liveSnapshot(manager);
        return sendJson(res, 200, { pids: snapshot });
      }

      if (req.method === 'GET' && url.pathname === '/dtc') {
        if (manager.getState() !== 'CONNECTED') return sendJson(res, 409, { error: 'NAO_CONECTADO' });
        const dtcs = await manager.readDtc();
        return sendJson(res, 200, {
          dtcs: dtcs.map(dtc => ({ code: dtc.code, description: describeDtc(dtc.code) })),
        });
      }

      if (req.method === 'GET' && url.pathname === '/freeze-frame') {
        if (manager.getState() !== 'CONNECTED') return sendJson(res, 409, { error: 'NAO_CONECTADO' });
        const frame = await manager.readFreezeFrame();
        if (!frame) return sendJson(res, 404, { error: 'SEM_FREEZE_FRAME' });
        const withNames = Object.fromEntries(
          Object.entries(frame).map(([pid, result]) => [pid, { ...result, name: STANDARD_PIDS[pid]?.name }]),
        );
        return sendJson(res, 200, { frame: withNames });
      }

      if (req.method === 'POST' && url.pathname === '/connect') {
        const body = await readJsonBody(req);
        const port = body.port;
        if (typeof port !== 'string' || !port) {
          return sendJson(res, 400, { error: 'PORTA_OBRIGATORIA' });
        }
        try {
          const profile = await manager.connect(port);
          return sendJson(res, 200, { profile });
        } catch (e) {
          return sendJson(res, 502, { error: manager.getLastError() ?? 'ERRO_CONEXAO' });
        }
      }

      if (req.method === 'POST' && url.pathname === '/disconnect') {
        await manager.disconnect();
        return sendJson(res, 200, { state: manager.getState() });
      }

      // Endpoints do simulador: só existem (e só fazem algo) quando o
      // transporte ativo é o SimulatorTransport - nunca aparecem/afetam nada
      // quando o serviço está rodando com hardware real (SerialTransport).
      if (req.method === 'GET' && url.pathname === '/simulator/scenarios') {
        if (!(transport instanceof SimulatorTransport)) {
          return sendJson(res, 404, { error: 'SIMULADOR_INDISPONIVEL' });
        }
        return sendJson(res, 200, {
          scenarios: Object.values(SCENARIOS).map(s => ({ id: s.id, label: s.label, description: s.description })),
        });
      }

      if (req.method === 'POST' && url.pathname === '/simulator/scenario') {
        if (!(transport instanceof SimulatorTransport)) {
          return sendJson(res, 404, { error: 'SIMULADOR_INDISPONIVEL' });
        }
        const body = await readJsonBody(req);
        const scenarioId = body.scenarioId;
        if (typeof scenarioId !== 'string' || !(scenarioId in SCENARIOS)) {
          return sendJson(res, 400, { error: 'CENARIO_INVALIDO' });
        }
        transport.setScenario(scenarioId);
        logger.info('Cenário do simulador alterado', { scenarioId });
        return sendJson(res, 200, { scenarioId });
      }

      // Endpoints de gravação/replay - RECORD -> SAVE do ciclo. O REPLAY em
      // si (reler o arquivo salvo) acontece reiniciando o serviço com
      // OBD_TRANSPORT=replay (ver src/index.ts), exatamente como já se troca
      // entre simulador e hardware real - não é um recurso "a mais", é o
      // mesmo mecanismo de seleção de transporte que já existia.
      if (req.method === 'GET' && url.pathname === '/recording/current') {
        if (!recorder) return sendJson(res, 404, { error: 'GRAVACAO_INDISPONIVEL' });
        return sendJson(res, 200, { frameCount: recorder.getFrameCount() });
      }

      if (req.method === 'POST' && url.pathname === '/recording/save') {
        if (!recorder || !recordingsDir) return sendJson(res, 404, { error: 'GRAVACAO_INDISPONIVEL' });
        if (recorder.getFrameCount() === 0) {
          return sendJson(res, 409, { error: 'NADA_GRAVADO_AINDA' });
        }
        const body = await readJsonBody(req);
        const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : undefined;
        const recording = recorder.getRecording();
        if (label) recording.label = label;
        const fileName = `${recording.id}.json`;
        saveRecordingToFile(recording, join(recordingsDir, fileName));
        logger.info('Sessão gravada salva em disco', { fileName, frameCount: recording.frames.length });
        return sendJson(res, 200, { fileName, id: recording.id, frameCount: recording.frames.length });
      }

      if (req.method === 'GET' && url.pathname === '/recording/list') {
        if (!recordingsDir) return sendJson(res, 404, { error: 'GRAVACAO_INDISPONIVEL' });
        return sendJson(res, 200, { recordings: listRecordingFiles(recordingsDir) });
      }

      return sendJson(res, 404, { error: 'ROTA_NAO_ENCONTRADA' });
    } catch (e) {
      logger.error('Unhandled gateway error', { error: e instanceof Error ? e.message : String(e), path: url.pathname });
      return sendJson(res, 500, { error: 'ERRO_INTERNO' });
    }
  });

  const wss = new WebSocketServer({ server, path: '/live/ws' });
  wss.on('connection', (socket: WebSocket) => {
    logger.info('WebSocket client connected for live data stream');
    const interval = setInterval(async () => {
      if (manager.getState() !== 'CONNECTED') {
        socket.send(JSON.stringify({ type: 'STATUS', state: manager.getState() }));
        return;
      }
      const snapshot = await liveSnapshot(manager);
      socket.send(JSON.stringify({ type: 'LIVE_DATA', pids: snapshot, timestamp: new Date().toISOString() }));
    }, LIVE_STREAM_INTERVAL_MS);

    socket.on('close', () => {
      clearInterval(interval);
      logger.info('WebSocket client disconnected');
    });
    socket.on('error', () => clearInterval(interval));
  });

  return server;
}
