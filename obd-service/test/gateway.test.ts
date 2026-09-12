import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/gateway/server';
import { ConnectionManager } from '../src/connection/ConnectionManager';
import { SimulatorTransport } from '../src/transport/SimulatorTransport';
import { SerialTransport } from '../src/transport/SerialTransport';

// Testa os endpoints /simulator/scenarios e /simulator/scenario do gateway
// HTTP: devem existir e funcionar só quando o transporte ativo é o
// SimulatorTransport, e nunca com o transporte serial (hardware real).
describe('gateway - endpoints do simulador', () => {
  let baseUrl: string;
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    const transport = new SimulatorTransport('idle-healthy');
    const manager = new ConnectionManager(transport);
    server = createServer(manager, { transport });
    await new Promise<void>(resolve => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));

  it('GET /simulator/scenarios lista os cenários disponíveis, incluindo os novos', async () => {
    const res = await fetch(`${baseUrl}/simulator/scenarios`);
    expect(res.status).toBe(200);
    const body = await res.json() as { scenarios: Array<{ id: string }> };
    const ids = body.scenarios.map(s => s.id);
    expect(ids).toEqual(expect.arrayContaining([
      'idle-healthy', 'lean-mixture-idle', 'rich-mixture-idle', 'misfire-with-dtc',
      'cold-start', 'warming-up', 'overheating', 'low-battery-key-on',
      'charging-failure-running', 'incoherent-coolant-sensor', 'multiple-dtcs', 'limited-pids',
    ]));
  });

  it('POST /simulator/scenario com um id válido troca o cenário sem reiniciar o serviço', async () => {
    const res = await fetch(`${baseUrl}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'overheating' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { scenarioId: string };
    expect(body.scenarioId).toBe('overheating');
  });

  it('POST /simulator/scenario com um id inválido retorna 400, nunca troca silenciosamente', async () => {
    const res = await fetch(`${baseUrl}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'cenario-que-nao-existe' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('gateway - endpoints do simulador nunca aparecem com transporte serial', () => {
  let baseUrl: string;
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    const serial = new SerialTransport();
    const manager = new ConnectionManager(serial);
    server = createServer(manager, { transport: serial });
    await new Promise<void>(resolve => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));

  it('GET /simulator/scenarios retorna 404 com transporte serial', async () => {
    const res = await fetch(`${baseUrl}/simulator/scenarios`);
    expect(res.status).toBe(404);
  });

  it('POST /simulator/scenario retorna 404 com transporte serial (nunca finge trocar cenário em hardware real)', async () => {
    const res = await fetch(`${baseUrl}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'idle-healthy' }),
    });
    expect(res.status).toBe(404);
  });
});
