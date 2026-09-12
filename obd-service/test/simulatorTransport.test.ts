import { describe, it, expect } from 'vitest';
import { SimulatorTransport } from '../src/transport/SimulatorTransport';

describe('SimulatorTransport', () => {
  it('não está conectado antes de connect()', () => {
    const t = new SimulatorTransport('idle-healthy');
    expect(t.isConnected()).toBe(false);
  });

  it('conecta e emite evento CONNECTED', async () => {
    const t = new SimulatorTransport('idle-healthy');
    const events: string[] = [];
    t.onEvent(e => events.push(e.type));
    await t.connect('SIMULATOR');
    expect(t.isConnected()).toBe(true);
    expect(events).toContain('CONNECTED');
  });

  it('desconecta e emite DISCONNECTED com reason USER_REQUEST', async () => {
    const t = new SimulatorTransport('idle-healthy');
    const events: Array<{ type: string; reason?: string }> = [];
    t.onEvent(e => events.push(e as any));
    await t.connect('SIMULATOR');
    await t.disconnect();
    expect(t.isConnected()).toBe(false);
    expect(events.find(e => e.type === 'DISCONNECTED')?.reason).toBe('USER_REQUEST');
  });

  it('retorna NO_RESPONSE se não conectado', async () => {
    const t = new SimulatorTransport('idle-healthy');
    const response = await t.send({ kind: 'READ_VOLTAGE' });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('NO_RESPONSE');
  });

  it('rejeita uma requisição perigosa mesmo conectado (usa o readOnlyGuard internamente)', async () => {
    const t = new SimulatorTransport('idle-healthy');
    await t.connect('SIMULATOR');
    await expect(t.send({ kind: 'CLEAR_DTC' } as any)).rejects.toThrow();
  });

  it('retorna UNSUPPORTED para um PID que o cenário não suporta', async () => {
    const t = new SimulatorTransport('idle-healthy');
    await t.connect('SIMULATOR');
    // '46' (temperatura ambiente) não está na lista de PIDs do cenário idle-healthy
    const response = await t.send({ kind: 'READ_PID', mode: '01', pid: '46' });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('UNSUPPORTED');
  });

  it('simula timeout quando faults.alwaysTimeout=true', async () => {
    const t = new SimulatorTransport('idle-healthy', { alwaysTimeout: true });
    await t.connect('SIMULATOR');
    const response = await t.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('TIMEOUT');
  });

  it('simula porta não encontrada quando faults.portNotFound=true', async () => {
    const t = new SimulatorTransport('idle-healthy', { portNotFound: true });
    await expect(t.connect('COM99')).rejects.toThrow('PORT_NOT_FOUND');
    expect(t.isConnected()).toBe(false);
  });

  it('simula desconexão inesperada após N leituras (faults.disconnectAfterReads)', async () => {
    const t = new SimulatorTransport('idle-healthy', { disconnectAfterReads: 2 });
    const events: string[] = [];
    t.onEvent(e => events.push(e.type));
    await t.connect('SIMULATOR');
    await t.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    await t.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    const third = await t.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    expect(third.ok).toBe(false);
    expect(t.isConnected()).toBe(false);
    expect(events.filter(e => e === 'DISCONNECTED').length).toBeGreaterThan(0);
  });

  it('cenário misfire-with-dtc expõe um DTC e um freeze frame; idle-healthy não expõe nenhum', async () => {
    const withDtc = new SimulatorTransport('misfire-with-dtc');
    await withDtc.connect('SIMULATOR');
    const dtcResponse = await withDtc.send({ kind: 'READ_DTC', mode: '03' });
    expect(dtcResponse.ok).toBe(true);
    expect(dtcResponse.bytes?.length).toBeGreaterThan(0);
    const frameResponse = await withDtc.send({ kind: 'READ_FREEZE_FRAME' });
    expect(frameResponse.ok).toBe(true);
    expect(frameResponse.frame).toBeDefined();

    const healthy = new SimulatorTransport('idle-healthy');
    await healthy.connect('SIMULATOR');
    const noDtc = await healthy.send({ kind: 'READ_DTC', mode: '03' });
    expect(noDtc.bytes?.length ?? 0).toBe(0);
    const noFrame = await healthy.send({ kind: 'READ_FREEZE_FRAME' });
    expect(noFrame.ok).toBe(false);
    expect(noFrame.error).toBe('UNSUPPORTED');
  });
});
