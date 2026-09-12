// lib/diagnostics/fromLiveData.ts
//
// Ponte entre um snapshot de /live do OBD Service (indexado por código de
// PID hex, ver lib/obd-client.ts) e uma DiagnosticSample rotulada (ver
// types.ts). Fica em lib/diagnostics para ser usada tanto pela UI
// (app/diagnostico) quanto pela camada de ferramentas do agente
// (lib/agent-tools.ts) - mas não importa lib/obd-client.ts diretamente
// (o núcleo do motor de diagnóstico continua sem depender de nenhum
// transporte específico); o formato de entrada é estrutural.

import { DiagnosticSample, PidShortName, PidStatus, PidValue } from './types';

const KNOWN_SHORT_NAMES: readonly string[] = [
  'RPM', 'COOLANT_TEMP', 'CONTROL_MODULE_VOLTAGE', 'ENGINE_LOAD', 'THROTTLE_POSITION',
  'STFT_B1', 'LTFT_B1', 'INTAKE_MAP', 'INTAKE_AIR_TEMP', 'MAF_RATE', 'VEHICLE_SPEED', 'FUEL_LEVEL',
];

const KNOWN_STATUSES: readonly string[] = ['OK', 'STALE', 'NOT_SUPPORTED', 'NO_RESPONSE', 'TIMEOUT', 'PROTOCOL_ERROR'];

export interface LivePidReadingLike {
  status: string;
  value?: number;
  unit?: string;
  shortName?: string;
}

/** Converte um snapshot de /live para uma DiagnosticSample rotulada - só
 * inclui PIDs cujo shortName o motor de diagnóstico conhece e cujo status
 * é um dos validados pelo OBD Service; nunca inventa um valor para um
 * status sem leitura numérica (NOT_SUPPORTED/NO_RESPONSE/TIMEOUT/
 * PROTOCOL_ERROR nunca carregam `value`). */
export function buildSampleFromLiveData(
  live: Record<string, LivePidReadingLike>,
  label: DiagnosticSample['label'],
  takenAt: string = new Date().toISOString(),
): DiagnosticSample {
  const pids: DiagnosticSample['pids'] = {};

  for (const reading of Object.values(live)) {
    const shortName = reading.shortName;
    if (!shortName || !KNOWN_SHORT_NAMES.includes(shortName)) continue;
    if (!KNOWN_STATUSES.includes(reading.status)) continue;

    const status = reading.status as PidStatus;
    if (status === 'OK' || status === 'STALE') {
      if (typeof reading.value !== 'number' || !Number.isFinite(reading.value)) continue;
      const value: PidValue = { status, value: reading.value, unit: reading.unit };
      pids[shortName as PidShortName] = value;
    } else {
      pids[shortName as PidShortName] = { status };
    }
  }

  return { label, takenAt, pids };
}
