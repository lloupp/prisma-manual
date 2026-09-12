import { describe, it, expect } from 'vitest';
import { buildSampleFromLiveData } from '../lib/diagnostics/fromLiveData';

describe('buildSampleFromLiveData', () => {
  it('inclui apenas PIDs com shortName conhecido pelo motor de diagnóstico', () => {
    const sample = buildSampleFromLiveData({
      '0C': { status: 'OK', value: 850, unit: 'rpm', shortName: 'RPM' },
      'XX': { status: 'OK', value: 999, unit: '?', shortName: 'PID_DESCONHECIDO' },
    }, 'idle');
    expect(sample.pids.RPM).toEqual({ status: 'OK', value: 850, unit: 'rpm' });
    expect(Object.keys(sample.pids)).toEqual(['RPM']);
  });

  it('preserva o status sem valor para leituras não-OK/STALE (nunca inventa um número)', () => {
    const sample = buildSampleFromLiveData({
      '42': { status: 'TIMEOUT', shortName: 'CONTROL_MODULE_VOLTAGE' },
    }, 'idle');
    expect(sample.pids.CONTROL_MODULE_VOLTAGE).toEqual({ status: 'TIMEOUT' });
    expect((sample.pids.CONTROL_MODULE_VOLTAGE as any).value).toBeUndefined();
  });

  it('preserva leituras STALE com o valor, mas nunca como status OK', () => {
    const sample = buildSampleFromLiveData({
      '0C': { status: 'STALE', value: 850, unit: 'rpm', shortName: 'RPM' },
    }, 'idle');
    expect(sample.pids.RPM?.status).toBe('STALE');
    expect((sample.pids.RPM as any).value).toBe(850);
  });

  it('descarta uma leitura OK/STALE sem valor numérico finito, em vez de propagar NaN', () => {
    const sample = buildSampleFromLiveData({
      '0C': { status: 'OK', value: NaN, unit: 'rpm', shortName: 'RPM' },
      '05': { status: 'OK', shortName: 'COOLANT_TEMP' }, // sem value nenhum
    }, 'idle');
    expect(sample.pids.RPM).toBeUndefined();
    expect(sample.pids.COOLANT_TEMP).toBeUndefined();
  });

  it('ignora um status desconhecido/inesperado em vez de propagá-lo', () => {
    const sample = buildSampleFromLiveData({
      '0C': { status: 'ALGO_NOVO_INESPERADO', shortName: 'RPM' },
    }, 'idle');
    expect(sample.pids.RPM).toBeUndefined();
  });

  it('rotula a amostra e usa o timestamp informado', () => {
    const sample = buildSampleFromLiveData({}, 'higher_rpm', '2026-01-01T00:00:00.000Z');
    expect(sample.label).toBe('higher_rpm');
    expect(sample.takenAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
