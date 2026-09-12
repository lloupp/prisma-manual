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

export const SCENARIOS: Record<string, SimulatorScenario> = {
  [IDLE_HEALTHY.id]: IDLE_HEALTHY,
  [LEAN_MIXTURE_IDLE.id]: LEAN_MIXTURE_IDLE,
  [MISFIRE_WITH_DTC.id]: MISFIRE_WITH_DTC,
};

export const DEFAULT_SCENARIO_ID = IDLE_HEALTHY.id;
