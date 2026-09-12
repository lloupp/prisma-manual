// Testa o comportamento (não só a superfície) das duas ferramentas novas
// do agente ligadas ao motor de diagnóstico: capture_diagnostic_sample e
// run_diagnosis (lib/agent-tools.ts). Mocka lib/obd-client para não
// depender do OBD Service estar rodando - complementa
// agent-tools-safety.test.ts, que só verifica a superfície estrutural.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/obd-client', () => ({
  getStatus: vi.fn(),
  getLive: vi.fn(),
}));

import * as obd from '../lib/obd-client';
import { capture_diagnostic_sample, run_diagnosis } from '../lib/agent-tools';
import { DiagnosticCase } from '../lib/diagnostics/types';

describe('capture_diagnostic_sample', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejeita um rótulo fora do conjunto permitido sem sequer consultar o OBD Service', async () => {
    const result = await capture_diagnostic_sample('regime_inventado' as any);
    expect(result.ok).toBe(false);
    expect(obd.getStatus).not.toHaveBeenCalled();
  });

  it('retorna falha quando o veículo não está conectado, sem tentar ler /live', async () => {
    vi.mocked(obd.getStatus).mockResolvedValue({ state: 'DISCONNECTED', profile: null, lastError: null });
    const result = await capture_diagnostic_sample('idle');
    expect(result.ok).toBe(false);
    expect(obd.getLive).not.toHaveBeenCalled();
  });

  it('com o veículo conectado, converte o snapshot de /live numa DiagnosticSample rotulada', async () => {
    vi.mocked(obd.getStatus).mockResolvedValue({
      state: 'CONNECTED',
      profile: { port: 'SIMULATOR', protocol: 'DETECTADO', ecuResponded: true, supportedPids: ['0C'], discoveredAt: new Date().toISOString() },
      lastError: null,
    });
    vi.mocked(obd.getLive).mockResolvedValue({
      '0C': { status: 'OK', value: 800, unit: 'rpm', shortName: 'RPM' },
      '42': { status: 'TIMEOUT', shortName: 'CONTROL_MODULE_VOLTAGE' },
    } as any);
    const result = await capture_diagnostic_sample('idle');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.label).toBe('idle');
      expect(result.data.pids.RPM).toEqual({ status: 'OK', value: 800, unit: 'rpm' });
      // TIMEOUT nunca vira um valor - só o status é propagado.
      expect(result.data.pids.CONTROL_MODULE_VOLTAGE).toEqual({ status: 'TIMEOUT' });
    }
  });

  it('propaga falha de comunicação com o OBD Service sem travar', async () => {
    vi.mocked(obd.getStatus).mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await capture_diagnostic_sample('idle');
    expect(result.ok).toBe(false);
  });
});

describe('run_diagnosis', () => {
  it('rejeita um caso malformado (falta samples/dtcs/reportedTests) em vez de lançar', async () => {
    const result = await run_diagnosis({ symptom: 'x' } as unknown as DiagnosticCase);
    expect(result.ok).toBe(false);
  });

  it('roda o motor determinístico sobre um caso válido e devolve o relatório', async () => {
    const result = await run_diagnosis({ symptom: 'teste', dtcs: [], samples: [], reportedTests: [] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.insufficientData).toBe(true);
      expect(result.data.hypotheses[0].id).toBe('hyp-insufficient-data');
    }
  });

  it('nunca chama o OBD Service - é uma função pura sobre o caso recebido', async () => {
    await run_diagnosis({ symptom: 'teste', dtcs: [], samples: [], reportedTests: [] });
    expect(obd.getStatus).not.toHaveBeenCalled();
    expect(obd.getLive).not.toHaveBeenCalled();
  });
});
