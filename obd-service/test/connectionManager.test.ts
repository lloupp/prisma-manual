import { describe, it, expect } from 'vitest';
import { ConnectionManager } from '../src/connection/ConnectionManager';
import { SimulatorTransport } from '../src/transport/SimulatorTransport';

describe('ConnectionManager', () => {
  it('descobre corretamente os PIDs suportados pelo cenário, incluindo banks acima de 0x20', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy'));
    const profile = await manager.connect('SIMULATOR');
    expect(profile.ecuResponded).toBe(true);
    expect(profile.supportedPids).toEqual(expect.arrayContaining(['0C', '05', '42', '2F']));
  });

  it('readPid retorna NOT_SUPPORTED para um PID fora do perfil descoberto, nunca zero', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy'));
    await manager.connect('SIMULATOR');
    const result = await manager.readPid('46'); // não suportado no cenário idle-healthy
    expect(result.status).toBe('NOT_SUPPORTED');
    expect((result as any).value).toBeUndefined();
  });

  it('readPid retorna OK com o valor decodificado para um PID suportado', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy'));
    await manager.connect('SIMULATOR');
    const result = await manager.readPid('0C');
    expect(result.status).toBe('OK');
    if (result.status === 'OK') {
      expect(result.value).toBeGreaterThan(0);
      expect(result.unit).toBe('rpm');
    }
  });

  it('readPid antes de conectar retorna NO_RESPONSE, nunca um valor', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy'));
    const result = await manager.readPid('0C');
    expect(result.status).toBe('NO_RESPONSE');
  });

  it('readDtc retorna a lista decodificada de códigos', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('misfire-with-dtc'));
    await manager.connect('SIMULATOR');
    const dtcs = await manager.readDtc();
    expect(dtcs.map(d => d.code)).toEqual(['P0301']);
  });

  it('disconnect() limpa o perfil e o estado', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy'));
    await manager.connect('SIMULATOR');
    await manager.disconnect();
    expect(manager.getState()).toBe('DISCONNECTED');
    expect(manager.getProfile()).toBeNull();
  });

  it('tenta reconectar automaticamente após perda de conexão inesperada', async () => {
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy', { disconnectAfterReads: 1 }));
    await manager.connect('SIMULATOR');
    // Força a leitura que dispara a desconexão simulada
    await manager.readPid('0C');
    // handleUnexpectedDisconnect é assíncrono (setTimeout de backoff) -
    // aguardamos o suficiente para pelo menos uma tentativa de reconexão.
    await new Promise(resolve => setTimeout(resolve, 1300));
    expect(['CONNECTED', 'RECONNECTING']).toContain(manager.getState());
  }, 10000);
});
