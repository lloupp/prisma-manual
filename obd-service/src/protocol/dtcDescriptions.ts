/**
 * Descrições de códigos DTC GENÉRICOS do padrão SAE J2012 (a faixa
 * "genérica" de cada categoria - para P0xxx, os primeiros ~pouco mais de
 * cem códigos são definidos pela própria norma SAE e têm o MESMO
 * significado em qualquer fabricante, incluindo GM). Isto não é
 * específico do Prisma - é o padrão público usado por toda a indústria.
 *
 * Deliberadamente pequeno e conservador: só incluímos aqui os códigos cuja
 * descrição genérica SAE é amplamente documentada e não ambígua. Qualquer
 * DTC fora desta tabela (incluindo qualquer código específico de
 * fabricante, faixa P1xxx/P3xxx da GM) retorna null e a UI deve mostrar
 * "Descrição não confirmada por documentação técnica" em vez de adivinhar.
 */
export const GENERIC_DTC_DESCRIPTIONS: Record<string, string> = {
  P0300: 'Falha de ignição detectada - cilindro(s) não identificado(s) ou aleatório(a)',
  P0301: 'Falha de ignição detectada no cilindro 1',
  P0302: 'Falha de ignição detectada no cilindro 2',
  P0303: 'Falha de ignição detectada no cilindro 3',
  P0304: 'Falha de ignição detectada no cilindro 4',
  P0171: 'Sistema muito pobre (Banco 1)',
  P0172: 'Sistema muito rico (Banco 1)',
  P0174: 'Sistema muito pobre (Banco 2)',
  P0175: 'Sistema muito rico (Banco 2)',
  P0128: 'Temperatura do líquido de arrefecimento abaixo da temperatura de regulagem do termostato',
  P0113: 'Sensor de temperatura do ar de admissão - sinal alto',
  P0112: 'Sensor de temperatura do ar de admissão - sinal baixo',
  P0121: 'Sensor de posição da borboleta/pedal - faixa/desempenho do circuito',
  P0442: 'Sistema de controle de emissões evaporativas - fuga detectada (pequena)',
  P0455: 'Sistema de controle de emissões evaporativas - fuga detectada (grande)',
  P0500: 'Sensor de velocidade do veículo - mau funcionamento',
};

export function describeDtc(code: string): string | null {
  return GENERIC_DTC_DESCRIPTIONS[code.toUpperCase()] ?? null;
}
