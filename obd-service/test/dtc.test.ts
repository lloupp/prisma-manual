import { describe, it, expect } from 'vitest';
import { decodeDtc, decodeDtcResponse } from '../src/protocol/dtc';
import { describeDtc } from '../src/protocol/dtcDescriptions';

describe('decodeDtc (SAE J2012 / ISO 15031-6)', () => {
  it('decodifica P0301 (falha de ignição cilindro 1) a partir dos bytes corretos', () => {
    // P = 00, primeiro dígito 0, segundo 3, terceiro 0, quarto 1
    // byte1 = 00 00 0011 -> categoria(00)=P, digit1(00)=0, digit2(0011)=3
    // byte2 = 0000 0001 -> digit3(0000)=0, digit4(0001)=1
    const result = decodeDtc(0b00000011, 0b00000001);
    expect(result.code).toBe('P0301');
  });

  it('categoriza corretamente C, B, U pelos 2 bits mais significativos', () => {
    expect(decodeDtc(0b01000000, 0).code[0]).toBe('C');
    expect(decodeDtc(0b10000000, 0).code[0]).toBe('B');
    expect(decodeDtc(0b11000000, 0).code[0]).toBe('U');
  });

  it('decodeDtcResponse ignora pares 00 00 (sem DTC / preenchimento)', () => {
    const dtcs = decodeDtcResponse([0x00, 0x00, 0b00000011, 0b00000001, 0x00, 0x00]);
    expect(dtcs.map(d => d.code)).toEqual(['P0301']);
  });
});

describe('describeDtc - só descreve o que é genérico/confirmado', () => {
  it('retorna a descrição SAE genérica para P0301', () => {
    expect(describeDtc('P0301')).toMatch(/ignição/i);
  });

  it('retorna null (não inventa descrição) para um código fora da tabela conservadora', () => {
    expect(describeDtc('P1234')).toBeNull();
    expect(describeDtc('U0999')).toBeNull();
  });
});
