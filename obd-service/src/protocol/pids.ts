/**
 * Tabela de PIDs padrão OBD-II Modo 01 (SAE J1979 / ISO 15031-5).
 *
 * IMPORTANTE: estes são PIDs do padrão universal OBD-II, definidos pela SAE,
 * não específicos do Chevrolet Prisma. Fórmulas de decodificação são as do
 * padrão público SAE J1979 - não são "inventadas" nem específicas do
 * veículo. O que o Prisma REALMENTE responde para cada PID só é conhecido
 * consultando o veículo real (ver `supportedPids` retornado pela ECU em
 * tempo de execução); nenhum valor é assumido como suportado a priori.
 *
 * Fonte: SAE J1979 (norma pública, referenciada por praticamente toda
 * literatura OBD-II, incluindo a documentação do próprio adaptador ELM327).
 */

export interface PidDefinition {
  pid: string; // hex, 2 chars, ex: "0C"
  name: string;
  shortName: string;
  unit: string;
  bytes: number; // quantos bytes de dados a resposta traz (além do echo de modo/pid)
  decode: (bytes: number[]) => number;
}

export const STANDARD_PIDS: Record<string, PidDefinition> = {
  '04': {
    pid: '04',
    name: 'Carga calculada do motor',
    shortName: 'ENGINE_LOAD',
    unit: '%',
    bytes: 1,
    decode: ([a]) => (a / 255) * 100,
  },
  '05': {
    pid: '05',
    name: 'Temperatura do líquido de arrefecimento',
    shortName: 'COOLANT_TEMP',
    unit: '°C',
    bytes: 1,
    decode: ([a]) => a - 40,
  },
  '06': {
    pid: '06',
    name: 'Correção de combustível de curto prazo (Banco 1)',
    shortName: 'STFT_B1',
    unit: '%',
    bytes: 1,
    decode: ([a]) => ((a - 128) * 100) / 128,
  },
  '07': {
    pid: '07',
    name: 'Correção de combustível de longo prazo (Banco 1)',
    shortName: 'LTFT_B1',
    unit: '%',
    bytes: 1,
    decode: ([a]) => ((a - 128) * 100) / 128,
  },
  '0B': {
    pid: '0B',
    name: 'Pressão absoluta do coletor de admissão',
    shortName: 'INTAKE_MAP',
    unit: 'kPa',
    bytes: 1,
    decode: ([a]) => a,
  },
  '0C': {
    pid: '0C',
    name: 'Rotação do motor',
    shortName: 'RPM',
    unit: 'rpm',
    bytes: 2,
    decode: ([a, b]) => (a * 256 + b) / 4,
  },
  '0D': {
    pid: '0D',
    name: 'Velocidade do veículo',
    shortName: 'VEHICLE_SPEED',
    unit: 'km/h',
    bytes: 1,
    decode: ([a]) => a,
  },
  '0F': {
    pid: '0F',
    name: 'Temperatura do ar de admissão',
    shortName: 'INTAKE_AIR_TEMP',
    unit: '°C',
    bytes: 1,
    decode: ([a]) => a - 40,
  },
  '10': {
    pid: '10',
    name: 'Vazão de ar do sensor MAF',
    shortName: 'MAF_RATE',
    unit: 'g/s',
    bytes: 2,
    decode: ([a, b]) => (a * 256 + b) / 100,
  },
  '11': {
    pid: '11',
    name: 'Posição da borboleta (acelerador)',
    shortName: 'THROTTLE_POSITION',
    unit: '%',
    bytes: 1,
    decode: ([a]) => (a / 255) * 100,
  },
  '2F': {
    pid: '2F',
    name: 'Nível do combustível',
    shortName: 'FUEL_LEVEL',
    unit: '%',
    bytes: 1,
    decode: ([a]) => (a / 255) * 100,
  },
  '42': {
    pid: '42',
    name: 'Tensão do módulo de controle (ECU)',
    shortName: 'CONTROL_MODULE_VOLTAGE',
    unit: 'V',
    bytes: 2,
    decode: ([a, b]) => (a * 256 + b) / 1000,
  },
};

export type PidShortName =
  | 'ENGINE_LOAD'
  | 'COOLANT_TEMP'
  | 'STFT_B1'
  | 'LTFT_B1'
  | 'INTAKE_MAP'
  | 'RPM'
  | 'VEHICLE_SPEED'
  | 'INTAKE_AIR_TEMP'
  | 'MAF_RATE'
  | 'THROTTLE_POSITION'
  | 'FUEL_LEVEL'
  | 'CONTROL_MODULE_VOLTAGE';

/**
 * Decodifica o bitmask de PIDs suportados retornado pelo PID 00 (e 20, 40...).
 * Cada bit, na ordem A7..A0 B7..B0 C7..C0 D7..D0, indica se o PID
 * (offset+1) até (offset+32) é suportado. Formato padrão SAE J1979.
 */
export function decodeSupportedPidsBitmask(bytes: number[], offset: number): string[] {
  const supported: string[] = [];
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }
  bits.forEach((bit, index) => {
    if (bit === 1) {
      const pidNumber = offset + index + 1;
      supported.push(pidNumber.toString(16).padStart(2, '0').toUpperCase());
    }
  });
  return supported;
}
