/**
 * Cenários do OBD Simulator. Estes são dados SINTÉTICOS gerados para
 * desenvolvimento/testes - nunca são apresentados como fatos do veículo
 * real. A UI deve sempre indicar claramente "SIMULADOR" quando estes dados
 * estiverem em uso (ver app/scanner/page.tsx).
 */

export interface SimulatedPidValue {
  pid: string;
  bytes: number[];
}

export interface SimulatorScenario {
  id: string;
  label: string;
  description: string;
  supportedPids: string[];
  dtcs: string[]; // já como bytes-pair hex, ex: "0301" para P0301
  /** Gera os bytes atuais para um PID, variando com o tempo (t em segundos
   * desde a conexão) para simular RPM/temperatura subindo, fuel trim
   * oscilando etc. */
  samplePid(pid: string, t: number): number[] | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function u16(value: number): number[] {
  const v = Math.round(clamp(value, 0, 65535));
  return [Math.floor(v / 256), v % 256];
}

function u8(value: number): number[] {
  return [Math.round(clamp(value, 0, 255))];
}

/** Cenário 1: marcha lenta estável, motor já quente, sem falhas. */
export const IDLE_HEALTHY: SimulatorScenario = {
  id: 'idle-healthy',
  label: 'Marcha lenta, motor saudável',
  description: 'Motor em marcha lenta, temperatura de operação normal, sem DTCs.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    const wobble = Math.sin(t / 3) * 20;
    switch (pid) {
      case '04': return u8(20 + Math.sin(t / 5) * 3); // carga baixa em marcha lenta
      case '05': return u8(90); // 90-40=50°C acima do zero da fórmula => ~ 90 representa 50°C real
      case '06': return u8(128 + Math.sin(t / 2) * 3);
      case '07': return u8(128 + Math.sin(t / 9) * 2);
      case '0B': return u8(35);
      case '0C': return u16((800 + wobble) * 4);
      case '0D': return u8(0); // parado
      case '0F': return u8(65); // 25°C
      case '10': return u16(250);
      case '11': return u8(Math.round((14 / 100) * 255));
      case '2F': return u8(Math.round((60 / 100) * 255));
      case '42': return u16(14200); // 14.2V
      default: return null;
    }
  },
};

/** Cenário 2: LTFT alto e crescente em marcha lenta (indício típico de
 * entrada falsa de ar / vazamento de vácuo) - usado para testar o
 * raciocínio por hipóteses do agente, sem afirmar uma causa definitiva. */
export const LEAN_MIXTURE_IDLE: SimulatorScenario = {
  id: 'lean-mixture-idle',
  label: 'LTFT elevado em marcha lenta',
  description: 'Long Term Fuel Trim positivo e crescente em marcha lenta - cenário de teste para diagnóstico por hipóteses (ex.: possível entrada falsa de ar). Nenhuma causa é afirmada pelo simulador.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    switch (pid) {
      case '04': return u8(22);
      case '05': return u8(90);
      case '06': return u8(128 + 4);
      case '07': {
        // LTFT sobe gradualmente até estabilizar em ~+16%
        const pct = clamp((t / 30) * 16, 0, 16);
        return u8(128 + (pct * 128) / 100);
      }
      case '0B': return u8(33);
      case '0C': return u16(850 * 4);
      case '0D': return u8(0);
      case '0F': return u8(63);
      case '10': return u16(240);
      case '11': return u8(Math.round((14 / 100) * 255));
      case '2F': return u8(Math.round((55 / 100) * 255));
      case '42': return u16(14100);
      default: return null;
    }
  },
};

/** Cenário 3: DTC de falha de ignição no cilindro 1 (P0301), com freeze
 * frame - usado para testar a tela de DTC/freeze frame. */
export const MISFIRE_WITH_DTC: SimulatorScenario = {
  id: 'misfire-with-dtc',
  label: 'Falha de ignição (DTC P0301) com freeze frame',
  description: 'Simula uma ECU com DTC P0301 armazenado e freeze frame capturado.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: ['0301'],
  samplePid(pid, t) {
    switch (pid) {
      case '04': return u8(45);
      case '05': return u8(88);
      case '06': return u8(128 - 6);
      case '07': return u8(128 + 8);
      case '0B': return u8(48);
      case '0C': return u16(2450 * 4);
      case '0D': return u8(42);
      case '0F': return u8(58);
      case '10': return u16(520);
      case '11': return u8(Math.round((35 / 100) * 255));
      case '2F': return u8(Math.round((48 / 100) * 255));
      case '42': return u16(13800);
      default: return null;
    }
  },
};

/** Cenário 4: mistura rica em marcha lenta (oposto do cenário 2) - LTFT/STFT
 * negativos e crescentes em módulo, outro cenário de teste para o motor de
 * hipóteses (ex.: possível MAF superestimando fluxo de ar, injetor
 * vazando). Nenhuma causa é afirmada pelo simulador. */
export const RICH_MIXTURE_IDLE: SimulatorScenario = {
  id: 'rich-mixture-idle',
  label: 'LTFT muito negativo em marcha lenta',
  description: 'Long Term Fuel Trim negativo e crescente em módulo em marcha lenta - cenário de teste para diagnóstico por hipóteses (ex.: possível mistura rica). Nenhuma causa é afirmada pelo simulador.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    switch (pid) {
      case '04': return u8(18);
      case '05': return u8(90);
      case '06': return u8(128 - 3);
      case '07': {
        const pct = clamp((t / 30) * 15, 0, 15);
        return u8(128 - (pct * 128) / 100);
      }
      case '0B': return u8(37);
      case '0C': return u16(830 * 4);
      case '0D': return u8(0);
      case '0F': return u8(64);
      case '10': return u16(280);
      case '11': return u8(Math.round((14 / 100) * 255));
      case '2F': return u8(Math.round((58 / 100) * 255));
      case '42': return u16(14150);
      default: return null;
    }
  },
};

/** Cenário 5: partida a frio - temperatura do líquido de arrefecimento e do
 * ar de admissão baixas, marcha lenta mais alta que o normal (típico de
 * ECU em modo de aquecimento), aquecendo gradualmente. */
export const COLD_START: SimulatorScenario = {
  id: 'cold-start',
  label: 'Partida a frio',
  description: 'Motor recém-ligado, temperatura de arrefecimento baixa e subindo gradualmente, marcha lenta em rotação mais alta que a de motor quente (comportamento típico de estratégia de aquecimento da ECU).',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    const coolant = clamp(15 + t * 0.6, 15, 90);
    const rpm = clamp(1200 - t * 3, 800, 1200);
    switch (pid) {
      case '04': return u8(32 + Math.sin(t / 4) * 3);
      case '05': return u8(coolant + 40);
      case '06': return u8(128 + Math.sin(t / 3) * 2); // trims próximos de zero (malha aberta durante aquecimento)
      case '07': return u8(128 + Math.sin(t / 7));
      case '0B': return u8(46);
      case '0C': return u16(rpm * 4);
      case '0D': return u8(0);
      case '0F': return u8(12 + 40); // ar de admissão frio, ~12°C
      case '10': return u16(320);
      case '11': return u8(0);
      case '2F': return u8(Math.round((55 / 100) * 255));
      case '42': return u16(14300);
      default: return null;
    }
  },
};

/** Cenário 6: aquecimento em andamento - temperatura já subiu de um início
 * frio, mas ainda não estabilizou na faixa normal; marcha lenta baixando
 * de volta ao valor de motor quente. Complementa cold-start para exercitar
 * o meio da transição, não só os extremos. */
export const WARMING_UP: SimulatorScenario = {
  id: 'warming-up',
  label: 'Aquecendo (transição frio -> quente)',
  description: 'Motor em transição de frio para quente - temperatura subindo de ~55°C para a faixa normal, marcha lenta baixando de volta ao valor típico de motor quente.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    const coolant = clamp(55 + t * 0.7, 55, 90);
    const rpm = clamp(950 - t * 2, 800, 950);
    switch (pid) {
      case '04': return u8(24 + Math.sin(t / 4) * 3);
      case '05': return u8(coolant + 40);
      case '06': return u8(128 + Math.sin(t / 3) * 3);
      case '07': return u8(128 + Math.sin(t / 5) * 2);
      case '0B': return u8(37);
      case '0C': return u16(rpm * 4);
      case '0D': return u8(0);
      case '0F': return u8(30 + 40);
      case '10': return u16(260);
      case '11': return u8(0);
      case '2F': return u8(Math.round((57 / 100) * 255));
      case '42': return u16(14200);
      default: return null;
    }
  },
};

/** Cenário 7: motor operando acima da temperatura normal e subindo - usado
 * para exercitar a heurística genérica de sobreaquecimento do motor de
 * diagnóstico (ver lib/diagnostics/rules.ts, ruleOverheating). O limiar
 * usado ali é uma heurística genérica de motores a gasolina, não uma
 * especificação confirmada do termostato do Prisma. */
export const OVERHEATING: SimulatorScenario = {
  id: 'overheating',
  label: 'Temperatura do motor elevada',
  description: 'Temperatura do líquido de arrefecimento acima do normal e subindo lentamente - cenário de teste. Não representa a temperatura real de abertura do termostato do Prisma, que não está confirmada em documentação técnica.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    const coolant = clamp(108 + t * 0.05, 108, 118);
    switch (pid) {
      case '04': return u8(22 + Math.sin(t / 5) * 3);
      case '05': return u8(coolant + 40);
      case '06': return u8(128 + 2);
      case '07': return u8(128 + 3);
      case '0B': return u8(38);
      case '0C': return u16(870 * 4);
      case '0D': return u8(0);
      case '0F': return u8(35 + 40);
      case '10': return u16(255);
      case '11': return u8(0);
      case '2F': return u8(Math.round((50 / 100) * 255));
      case '42': return u16(14150);
      default: return null;
    }
  },
};

/** Cenário 8: bateria fraca com a chave ligada e o motor DESLIGADO (tensão
 * baixa, RPM zero) - distinto do cenário de falha de carga (motor
 * funcionando, tensão baixa mesmo assim). Testa se o agente/motor de
 * diagnóstico distingue os dois casos em vez de tratá-los como a mesma
 * causa. */
export const LOW_BATTERY_KEY_ON: SimulatorScenario = {
  id: 'low-battery-key-on',
  label: 'Bateria fraca (chave ligada, motor desligado)',
  description: 'Chave na posição ligada, motor desligado (RPM=0), tensão da bateria já baixa antes mesmo da partida - distinto de uma falha do sistema de carga com o motor em funcionamento.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid) {
    switch (pid) {
      case '04': return u8(0);
      case '05': return u8(25 + 40);
      case '06': return u8(128);
      case '07': return u8(128);
      case '0B': return u8(100); // pressão atmosférica, motor não está sugando vácuo
      case '0C': return u16(0);
      case '0D': return u8(0);
      case '0F': return u8(25 + 40);
      case '10': return u16(0);
      case '11': return u8(0);
      case '2F': return u8(Math.round((50 / 100) * 255));
      case '42': return u16(10800); // 10.8V - bateria fraca
      default: return null;
    }
  },
};

/** Cenário 9: falha do sistema de carga com o motor EM FUNCIONAMENTO -
 * tensão permanece baixa mesmo em marcha lenta e não melhora com o motor
 * ligado (diferente de uma leitura de marcha lenta simplesmente baixa por
 * natureza do alternador, que se recupera em rotação mais alta). */
export const CHARGING_FAILURE_RUNNING: SimulatorScenario = {
  id: 'charging-failure-running',
  label: 'Falha do sistema de carga (motor funcionando)',
  description: 'Motor em funcionamento, mas a tensão do módulo de controle permanece baixa (~11.6V) e não sobe - cenário de teste para diferenciar de uma bateria fraca sem o motor funcionando.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid, t) {
    switch (pid) {
      case '04': return u8(20 + Math.sin(t / 5) * 2);
      case '05': return u8(90);
      case '06': return u8(128 + 1);
      case '07': return u8(128 + 2);
      case '0B': return u8(35);
      case '0C': return u16((830 + Math.sin(t / 3) * 15) * 4);
      case '0D': return u8(0);
      case '0F': return u8(65);
      case '10': return u16(250);
      case '11': return u8(Math.round((14 / 100) * 255));
      case '2F': return u8(Math.round((60 / 100) * 255));
      case '42': return u16(11600 + Math.sin(t / 4) * 30); // não normaliza acima de 13V
      default: return null;
    }
  },
};

/** Cenário 10: leitura de sensor fisicamente incoerente - temperatura do
 * líquido de arrefecimento extremamente negativa com o motor em
 * funcionamento normal, típico de um circuito de sensor aberto/em curto,
 * não de uma condição real do motor. Usado para exercitar
 * ruleIncoherentSensor. */
export const INCOHERENT_COOLANT_SENSOR: SimulatorScenario = {
  id: 'incoherent-coolant-sensor',
  label: 'Sensor de temperatura incoerente',
  description: 'Motor em funcionamento normal, mas o sensor de temperatura do líquido de arrefecimento retorna um valor fisicamente implausível (-40°C) - cenário de teste para falha de fiação/circuito do sensor, não uma condição real do motor.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: [],
  samplePid(pid) {
    switch (pid) {
      case '04': return u8(20);
      case '05': return u8(0); // decodifica para -40°C - implausível com motor funcionando
      case '06': return u8(128);
      case '07': return u8(128);
      case '0B': return u8(35);
      case '0C': return u16(800 * 4);
      case '0D': return u8(0);
      case '0F': return u8(65);
      case '10': return u16(250);
      case '11': return u8(Math.round((14 / 100) * 255));
      case '2F': return u8(Math.round((60 / 100) * 255));
      case '42': return u16(14200);
      default: return null;
    }
  },
};

/** Cenário 11: múltiplos DTCs armazenados simultaneamente (falha de
 * ignição aleatória, sistema muito pobre banco 1, temperatura abaixo da
 * regulagem do termostato) - testa se o agente/motor de diagnóstico
 * consegue lidar com várias hipóteses concorrentes em vez de fixar em
 * apenas uma. */
export const MULTIPLE_DTCS: SimulatorScenario = {
  id: 'multiple-dtcs',
  label: 'Múltiplos DTCs armazenados',
  description: 'Simula uma ECU com três DTCs armazenados simultaneamente (P0300, P0171, P0128) e dados ao vivo consistentes com mistura pobre e aquecimento lento - cenário de teste para múltiplas hipóteses concorrentes.',
  supportedPids: ['04', '05', '06', '07', '0B', '0C', '0D', '0F', '10', '11', '2F', '42'],
  dtcs: ['0300', '0171', '0128'],
  samplePid(pid, t) {
    switch (pid) {
      case '04': return u8(26 + Math.sin(t / 3) * 4);
      case '05': return u8(68 + 40); // ainda não atingiu a temperatura normal (P0128)
      case '06': return u8(128 + 8);
      case '07': return u8(128 + 18); // LTFT bem positivo (P0171)
      case '0B': return u8(40);
      case '0C': return u16((850 + Math.sin(t) * 60) * 4); // marcha lenta instável (falha de ignição)
      case '0D': return u8(0);
      case '0F': return u8(20 + 40);
      case '10': return u16(230);
      case '11': return u8(0);
      case '2F': return u8(Math.round((52 / 100) * 255));
      case '42': return u16(14000);
      default: return null;
    }
  },
};

/** Cenário 12: ECU com um conjunto muito limitado de PIDs suportados -
 * testa se o agente/motor de diagnóstico trata corretamente PIDs não
 * suportados (NOT_SUPPORTED) em vez de qualquer valor, mesmo quando a
 * maioria das ferramentas de leitura pede um PID que esta ECU simulada
 * simplesmente não expõe. */
export const LIMITED_PIDS: SimulatorScenario = {
  id: 'limited-pids',
  label: 'ECU com poucos PIDs suportados',
  description: 'Simula uma ECU que só confirma suportar RPM e temperatura do líquido de arrefecimento - qualquer outro PID deve ser reportado como NOT_SUPPORTED, nunca como zero ou um valor inventado.',
  supportedPids: ['05', '0C'],
  dtcs: [],
  samplePid(pid, t) {
    switch (pid) {
      case '05': return u8(90);
      case '0C': return u16((800 + Math.sin(t / 3) * 20) * 4);
      default: return null;
    }
  },
};

export const SCENARIOS: Record<string, SimulatorScenario> = {
  [IDLE_HEALTHY.id]: IDLE_HEALTHY,
  [LEAN_MIXTURE_IDLE.id]: LEAN_MIXTURE_IDLE,
  [MISFIRE_WITH_DTC.id]: MISFIRE_WITH_DTC,
  [RICH_MIXTURE_IDLE.id]: RICH_MIXTURE_IDLE,
  [COLD_START.id]: COLD_START,
  [WARMING_UP.id]: WARMING_UP,
  [OVERHEATING.id]: OVERHEATING,
  [LOW_BATTERY_KEY_ON.id]: LOW_BATTERY_KEY_ON,
  [CHARGING_FAILURE_RUNNING.id]: CHARGING_FAILURE_RUNNING,
  [INCOHERENT_COOLANT_SENSOR.id]: INCOHERENT_COOLANT_SENSOR,
  [MULTIPLE_DTCS.id]: MULTIPLE_DTCS,
  [LIMITED_PIDS.id]: LIMITED_PIDS,
};

export const DEFAULT_SCENARIO_ID = IDLE_HEALTHY.id;
