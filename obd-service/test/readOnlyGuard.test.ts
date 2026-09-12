import { describe, it, expect } from 'vitest';
import { assertReadOnly, ReadOnlyViolationError } from '../src/validation/readOnlyGuard';

describe('assertReadOnly - segunda camada de defesa do modo somente-leitura', () => {
  const dangerous = [
    { kind: 'CLEAR_DTC' },
    { kind: 'WRITE_ECU', data: [1, 2, 3] },
    { kind: 'ACTUATOR_CONTROL', target: 'fuel_pump' },
    { kind: 'RAW_CAN_SEND', frame: '7DF#0201000000000000' },
    { kind: 'ECU_FLASH' },
    { kind: 'READ_DTC', mode: '04' }, // modo 04 = apagar DTC, mesmo disfarçado de READ_DTC
    'string sem shape',
    null,
    undefined,
    42,
    { kind: 'READ_PID', mode: '01', pid: 'ZZ' },
    { kind: 'READ_PID', mode: '03', pid: '0C' }, // modo inválido para leitura de PID atual
    { kind: 'READ_SUPPORTED_PIDS', bank: '99' },
  ];

  it.each(dangerous)('bloqueia %j', (request) => {
    expect(() => assertReadOnly(request)).toThrow(ReadOnlyViolationError);
  });

  const allowed = [
    { kind: 'READ_PID', mode: '01', pid: '0C' },
    { kind: 'READ_PID', mode: '02', pid: '05' },
    { kind: 'READ_SUPPORTED_PIDS', bank: '00' },
    { kind: 'READ_DTC', mode: '03' },
    { kind: 'READ_DTC', mode: '07' },
    { kind: 'READ_FREEZE_FRAME' },
    { kind: 'READ_VOLTAGE' },
    { kind: 'READ_PROTOCOL' },
  ];

  it.each(allowed)('permite %j', (request) => {
    expect(() => assertReadOnly(request)).not.toThrow();
  });
});
