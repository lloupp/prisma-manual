// Testa o ciclo RECORD -> SAVE -> REPLAY: RecordingTransport grava uma
// sessão real (aqui, sobre o SimulatorTransport, mas funcionaria igual
// sobre SerialTransport - RecordingTransport não sabe a diferença),
// storage.ts salva/lê essa gravação em disco, e ReplayTransport reproduz
// exatamente a sequência gravada sem tocar o transporte original.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SimulatorTransport } from '../src/transport/SimulatorTransport';
import { RecordingTransport } from '../src/transport/RecordingTransport';
import { ReplayTransport } from '../src/transport/ReplayTransport';
import { ConnectionManager } from '../src/connection/ConnectionManager';
import { saveRecordingToFile, loadRecordingFromFile, listRecordingFiles } from '../src/replay/storage';

describe('RecordingTransport', () => {
  it('encaminha connect/send/disconnect para o transporte interno normalmente', async () => {
    const inner = new SimulatorTransport('idle-healthy');
    const recorder = new RecordingTransport(inner);
    await recorder.connect('SIMULATOR');
    expect(recorder.isConnected()).toBe(true);
    expect(inner.isConnected()).toBe(true);
    const response = await recorder.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    expect(response.ok).toBe(true);
  });

  it('grava cada requisição/resposta enviada através dela', async () => {
    const recorder = new RecordingTransport(new SimulatorTransport('idle-healthy'));
    await recorder.connect('SIMULATOR');
    expect(recorder.getFrameCount()).toBe(0);
    await recorder.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    await recorder.send({ kind: 'READ_PID', mode: '01', pid: '05' });
    expect(recorder.getFrameCount()).toBe(2);
    const recording = recorder.getRecording();
    expect(recording.frames.length).toBe(2);
    expect(recording.frames[0].request).toEqual({ kind: 'READ_PID', mode: '01', pid: '0C' });
    expect(recording.frames[0].response.ok).toBe(true);
  });

  it('grava os eventos de conexão do transporte interno', async () => {
    const recorder = new RecordingTransport(new SimulatorTransport('idle-healthy'));
    await recorder.connect('SIMULATOR');
    await recorder.disconnect();
    const recording = recorder.getRecording();
    expect(recording.connectionEvents.map(e => e.event.type)).toEqual(
      expect.arrayContaining(['CONNECTED', 'DISCONNECTED']),
    );
  });

  it('através de um ConnectionManager completo, grava a descoberta de PIDs e leituras normalmente', async () => {
    const recorder = new RecordingTransport(new SimulatorTransport('idle-healthy'), 'teste');
    const manager = new ConnectionManager(recorder);
    await manager.connect('SIMULATOR');
    await manager.readPid('0C');
    await manager.readPid('05');
    expect(recorder.getFrameCount()).toBeGreaterThan(2); // + frames de descoberta de PIDs
  });

  it('clear() descarta os quadros gravados até agora sem desconectar', async () => {
    const recorder = new RecordingTransport(new SimulatorTransport('idle-healthy'));
    await recorder.connect('SIMULATOR');
    await recorder.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    recorder.clear();
    expect(recorder.getFrameCount()).toBe(0);
    expect(recorder.isConnected()).toBe(true);
  });
});

describe('storage: saveRecordingToFile / loadRecordingFromFile / listRecordingFiles', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'obd-recordings-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('salva e recarrega uma gravação sem perder nenhum quadro', async () => {
    const recorder = new RecordingTransport(new SimulatorTransport('misfire-with-dtc'), 'caso de teste');
    await recorder.connect('SIMULATOR');
    await recorder.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    await recorder.send({ kind: 'READ_DTC', mode: '03' });
    const recording = recorder.getRecording();

    const filePath = join(dir, `${recording.id}.json`);
    saveRecordingToFile(recording, filePath);
    const loaded = loadRecordingFromFile(filePath);

    expect(loaded.id).toBe(recording.id);
    expect(loaded.label).toBe('caso de teste');
    expect(loaded.frames.length).toBe(recording.frames.length);
    expect(loaded.frames).toEqual(recording.frames);
  });

  it('listRecordingFiles lista metadados sem precisar que o chamador carregue os frames', async () => {
    const recorder = new RecordingTransport(new SimulatorTransport('idle-healthy'), 'sessão A');
    await recorder.connect('SIMULATOR');
    await recorder.send({ kind: 'READ_PID', mode: '01', pid: '0C' });
    const recording = recorder.getRecording();
    saveRecordingToFile(recording, join(dir, `${recording.id}.json`));

    const list = listRecordingFiles(dir);
    expect(list.length).toBe(1);
    expect(list[0].label).toBe('sessão A');
    expect(list[0].frameCount).toBe(1);
  });

  it('listRecordingFiles retorna lista vazia (nunca lança) para um diretório inexistente', () => {
    expect(listRecordingFiles(join(dir, 'nao-existe'))).toEqual([]);
  });
});

describe('ReplayTransport', () => {
  async function recordASession() {
    const recorder = new RecordingTransport(new SimulatorTransport('lean-mixture-idle'), 'sessão gravada');
    const manager = new ConnectionManager(recorder);
    await manager.connect('SIMULATOR');
    await manager.readPid('0C');
    await manager.readPid('07');
    await manager.readPid('07'); // duas leituras do mesmo PID, em momentos diferentes
    return recorder.getRecording();
  }

  it('reproduz connect/disconnect emitindo os eventos esperados, sem transporte real por baixo', async () => {
    const recording = await recordASession();
    const replay = new ReplayTransport(recording);
    const events: string[] = [];
    replay.onEvent(e => events.push(e.type));
    await replay.connect('QUALQUER_PORTA');
    expect(replay.isConnected()).toBe(true);
    expect(events).toContain('CONNECTED');
    await replay.disconnect();
    expect(replay.isConnected()).toBe(false);
    expect(events).toContain('DISCONNECTED');
  });

  it('reproduz as respostas de um mesmo PID na ordem original em que foram gravadas', async () => {
    const recording = await recordASession();
    const replay = new ReplayTransport(recording);
    await replay.connect('QUALQUER_PORTA');

    const original07 = recording.frames.filter(f => f.request.kind === 'READ_PID' && f.request.pid === '07');
    expect(original07.length).toBe(2);

    const first = await replay.send({ kind: 'READ_PID', mode: '01', pid: '07' });
    const second = await replay.send({ kind: 'READ_PID', mode: '01', pid: '07' });
    expect(first).toEqual(original07[0].response);
    expect(second).toEqual(original07[1].response);
  });

  it('quando a gravação de um PID se esgota, repete o último quadro conhecido marcado como stale (nunca finge ser uma leitura fresca)', async () => {
    const recording = await recordASession();
    const replay = new ReplayTransport(recording);
    await replay.connect('QUALQUER_PORTA');

    await replay.send({ kind: 'READ_PID', mode: '01', pid: '07' });
    const last = await replay.send({ kind: 'READ_PID', mode: '01', pid: '07' });
    const afterExhausted = await replay.send({ kind: 'READ_PID', mode: '01', pid: '07' });

    expect(afterExhausted.stale).toBe(true);
    expect(afterExhausted.bytes).toEqual(last.bytes);
  });

  it('retorna UNSUPPORTED (nunca inventa dados) para uma requisição que nunca foi gravada nesta sessão', async () => {
    const recording = await recordASession();
    const replay = new ReplayTransport(recording);
    await replay.connect('QUALQUER_PORTA');
    // '10' (MAF) nunca foi lido durante a gravação desta sessão.
    const response = await replay.send({ kind: 'READ_PID', mode: '01', pid: '10' });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('UNSUPPORTED');
  });

  it('retorna NO_RESPONSE se send() for chamado antes de connect()', async () => {
    const recording = await recordASession();
    const replay = new ReplayTransport(recording);
    const response = await replay.send({ kind: 'READ_PID', mode: '01', pid: '07' });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('NO_RESPONSE');
  });

  it('rejeita uma requisição fora do allowlist mesmo em modo replay', async () => {
    const recording = await recordASession();
    const replay = new ReplayTransport(recording);
    await replay.connect('QUALQUER_PORTA');
    await expect(replay.send({ kind: 'CLEAR_DTC' } as any)).rejects.toThrow();
  });

  it('integrado a um ConnectionManager, readPid funciona normalmente sobre uma sessão reproduzida', async () => {
    const recording = await recordASession();
    const manager = new ConnectionManager(new ReplayTransport(recording));
    const profile = await manager.connect('QUALQUER_PORTA');
    // O protocolo detectado e os PIDs suportados vêm dos frames de
    // descoberta gravados originalmente, não são inventados pelo replay.
    expect(profile.supportedPids.length).toBeGreaterThan(0);
    const result = await manager.readPid('0C');
    expect(result.status).toBe('OK');
  });
});
