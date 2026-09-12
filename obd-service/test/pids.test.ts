import { describe, it, expect } from 'vitest';
import { STANDARD_PIDS, decodeSupportedPidsBitmask } from '../src/protocol/pids';

describe('decodificação de PIDs padrão SAE J1979', () => {
  it('RPM: ((A*256)+B)/4', () => {
    // 0x0C, A=0x1F(31), B=0x40(64) -> (31*256+64)/4 = 8000/4 = 2000
    expect(STANDARD_PIDS['0C'].decode([31, 64])).toBe(2000);
  });

  it('temperatura de arrefecimento: A-40', () => {
    expect(STANDARD_PIDS['05'].decode([90])).toBe(50);
    expect(STANDARD_PIDS['05'].decode([0])).toBe(-40);
  });

  it('carga do motor: A/255*100', () => {
    expect(STANDARD_PIDS['04'].decode([255])).toBe(100);
    expect(STANDARD_PIDS['04'].decode([0])).toBe(0);
  });

  it('fuel trim (STFT/LTFT): (A-128)*100/128, permite negativo e positivo', () => {
    expect(STANDARD_PIDS['06'].decode([128])).toBe(0);
    expect(STANDARD_PIDS['06'].decode([0])).toBe(-100);
    expect(STANDARD_PIDS['06'].decode([255])).toBeCloseTo(99.2, 1);
  });

  it('tensão do módulo de controle: ((A*256)+B)/1000', () => {
    // 14.2V -> 14200 -> A=55(0x37), B=120(0x78)
    expect(STANDARD_PIDS['42'].decode([0x37, 0x78])).toBeCloseTo(14.2, 3);
  });
});

describe('decodeSupportedPidsBitmask', () => {
  it('decodifica corretamente um bitmask conhecido (bank 00)', () => {
    // Bit mais significativo do byte 0 = PID 01, etc. Testamos com PID 0C
    // (RPM) marcado: é o 12º PID, ou seja, byte 1 (bits 9-16), bit relativo
    // 11 dentro dos 32 -> byte index 1, bit index dentro do byte = 11 - 8 = 3
    // -> 7 - 3 = 4 -> valor 1<<4 = 0x10
    const bytes = [0x00, 0x10, 0x00, 0x00];
    const supported = decodeSupportedPidsBitmask(bytes, 0);
    expect(supported).toEqual(['0C']);
  });

  it('offset desloca os números de PID corretamente (bank 20 = PIDs 21-40)', () => {
    const bytes = [0x80, 0x00, 0x00, 0x00]; // bit mais significativo = primeiro PID do bank
    const supported = decodeSupportedPidsBitmask(bytes, 0x20);
    expect(supported).toEqual(['21']);
  });
});
