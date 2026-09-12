import { describe, it, expect } from 'vitest';
import { ConnectionManager } from '../src/connection/ConnectionManager';
import { SimulatorTransport } from '../src/transport/SimulatorTransport';
import { OBDTransport, ConnectionEvent, PortDescriptor } from '../src/transport/OBDTransport';
import { assertReadOnly } from '../src/validation/readOnlyGuard';

/** Fake transporte que sempre conecta e responde com bytes truncados -
 * simula o tipo de resposta malformada que só apareceria em hardware
 * serial real (nunca no simulador, cujos dados são sempre bem formados). */
class TruncatedResponseTransport implements OBDTransport {
  private connected = false;
  async listPorts(): Promise<PortDescriptor[]> { return [{ path: 'FAKE' }]; }
  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }
  isConnected(): boolean { return this.connected; }
  onEvent(_listener: (event: ConnectionEvent) => void): void {}
  async send(rawRequest: unknown) {
    const request = assertReadOnly(rawRequest);
    if (request.kind === 'READ_SUPPORTED_PIDS' && request.bank === '00') {
      // Anuncia suporte ao PID 0C (RPM, que precisa de 2 bytes).
      return { ok: true, bytes: [0x00, 0x10, 0x00, 0x00] };
    }
    if (request.kind === 'READ_PID' && request.pid === '0C') {
      // RPM precisa de 2 bytes; devolve só 1 - resposta truncada/malformada.
      return { ok: true, bytes: [0x1f] };
    }
    return { ok: false, error: 'UNSUPPORTED' as const };
  }
}

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

  it('readPid retorna TIMEOUT sem nenhum valor quando o transporte não responde a tempo - nunca interpreta ausência como zero', async () => {
    // A descoberta de PIDs precisa suceder normalmente primeiro (senão '0C'
    // nunca entraria em supportedPids e o teste testaria NOT_SUPPORTED, não
    // TIMEOUT); o fault é ativado só depois, mutando o mesmo objeto de
    // faults que o transporte já guarda por referência.
    const faults = {};
    const manager = new ConnectionManager(new SimulatorTransport('idle-healthy', faults));
    await manager.connect('SIMULATOR');
    Object.assign(faults, { alwaysTimeout: true });
    const result = await manager.readPid('0C');
    expect(result.status).toBe('TIMEOUT');
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

  it('readPid nunca decodifica uma resposta truncada como um valor OK (protege contra hardware real malformado)', async () => {
    const manager = new ConnectionManager(new TruncatedResponseTransport());
    await manager.connect('FAKE');
    const result = await manager.readPid('0C');
    expect(result.status).toBe('PROTOCOL_ERROR');
    expect((result as any).value).toBeUndefined();
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
