/**
 * Decodificação de DTC (código de falha) a partir de 2 bytes, conforme
 * padrão SAE J2012 / ISO 15031-6. Isso é formato universal OBD-II, não
 * específico do Prisma - os 2 bits mais significativos do primeiro byte
 * definem a categoria (P=Powertrain, C=Chassis, B=Body, U=Network); os
 * bits restantes formam o número de 4 dígitos do código.
 */

const CATEGORY_BY_BITS: Record<number, string> = {
  0b00: 'P',
  0b01: 'C',
  0b10: 'B',
  0b11: 'U',
};

export interface DecodedDtc {
  code: string; // ex: "P0301"
  raw: [number, number];
}

export function decodeDtc(byte1: number, byte2: number): DecodedDtc {
  const categoryBits = (byte1 >> 6) & 0b11;
  const category = CATEGORY_BY_BITS[categoryBits];
  const digit1 = (byte1 >> 4) & 0b11; // 0-3
  const digit2 = byte1 & 0x0f; // 0-F (mas tipicamente 0-F, 4 bits)
  const digit3 = (byte2 >> 4) & 0x0f;
  const digit4 = byte2 & 0x0f;

  const code = `${category}${digit1}${digit2.toString(16)}${digit3.toString(16)}${digit4.toString(16)}`.toUpperCase();
  return { code, raw: [byte1, byte2] };
}

/**
 * Decodifica uma sequência de bytes de resposta do Modo 03/07 (DTCs
 * armazenados/pendentes) em uma lista de códigos. Bytes 00 00 são
 * preenchimento/ausência de DTC e são ignorados.
 */
export function decodeDtcResponse(bytes: number[]): DecodedDtc[] {
  const dtcs: DecodedDtc[] = [];
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const [b1, b2] = [bytes[i], bytes[i + 1]];
    if (b1 === 0 && b2 === 0) continue;
    dtcs.push(decodeDtc(b1, b2));
  }
  return dtcs;
}
