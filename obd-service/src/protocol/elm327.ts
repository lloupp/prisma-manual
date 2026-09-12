/**
 * Comandos AT do chipset ELM327, o adaptador OBD->USB/Bluetooth mais comum
 * no mercado (e compatível com a maioria dos "adaptadores genéricos" que
 * aparecem como COM3/COM4/etc. no Windows). Estes comandos são do
 * datasheet público do ELM327, não são específicos do Prisma - são a forma
 * de inicializar o ADAPTADOR, e não de ler dados do CARRO.
 *
 * Não adicionamos aqui nenhum comando que grave parâmetros do adaptador ou
 * do veículo (ex: ATSP com protocolo forçado permanentemente, ATPP para
 * programar EEPROM do adaptador) - apenas o necessário para reset,
 * silenciar eco/linefeed e negociar o protocolo automaticamente.
 */
export const ELM327_HANDSHAKE: readonly string[] = [
  'ATZ', // reset do adaptador
  'ATE0', // desliga eco (a resposta não repete o comando enviado)
  'ATL0', // desliga linefeed extra
  'ATS0', // desliga espaços na resposta (facilita o parsing)
  'ATSP0', // seleciona protocolo automaticamente (o adaptador detecta)
];

export const ELM327_READ_VOLTAGE = 'ATRV';
export const ELM327_DESCRIBE_PROTOCOL = 'ATDPN';

export function buildPidRequest(mode: '01' | '02' | '03' | '07', pid?: string): string {
  return pid ? `${mode}${pid}` : mode;
}

/** Analisa uma linha de resposta hexadecimal do adaptador em bytes. Rejeita
 * qualquer coisa que não seja uma sequência de pares hex válidos - nunca
 * tenta "adivinhar" um valor a partir de uma resposta malformada. */
export function parseHexResponse(line: string): number[] | null {
  const cleaned = line.trim().replace(/\s+/g, '');
  if (cleaned.length === 0 || cleaned.length % 2 !== 0) return null;
  if (!/^[0-9A-Fa-f]+$/.test(cleaned)) return null;
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}
