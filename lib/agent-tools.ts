// lib/agent-tools.ts
//
// Ferramentas seguras para um futuro agente de IA. Cada função aqui é uma
// chamada estruturada e de escopo fixo - nenhuma delas aceita um comando
// OBD arbitrário vindo do modelo, e nenhuma delas tem acesso à porta
// serial: tudo passa pelo OBD Service via HTTP (ver lib/obd-client.ts),
// que já impõe o modo somente-leitura por conta própria.
//
// Este arquivo NÃO conecta a nenhum provedor de LLM - é a camada de
// ferramentas que um agente (quando existir) chamaria. Conectar isso a um
// chat de verdade é a próxima fase (ver AGENTS.md, "Próxima fase").

import * as obd from './obd-client';
import { searchAll } from './search';
import { getGuideById, getPartById, getSystemById, getDiagnosticSessions } from './selectors';

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string };

function ok<T>(data: T): ToolResult<T> {
  return { ok: true, data };
}

function fail<T = never>(error: string, message: string): ToolResult<T> {
  return { ok: false, error, message };
}

async function readSinglePid(shortName: string): Promise<ToolResult<{ value: number; unit: string } | { status: 'NOT_SUPPORTED' | 'NO_RESPONSE' | 'TIMEOUT' | 'PROTOCOL_ERROR' }>> {
  try {
    const status = await obd.getStatus();
    if (status.state !== 'CONNECTED') {
      return fail('NAO_CONECTADO', 'O veículo não está conectado ao Scanner OBD.');
    }
    const live = await obd.getLive();
    const entry = Object.values(live).find(reading => (reading as any).shortName === shortName);
    if (!entry) {
      return ok({ status: 'NOT_SUPPORTED' as const });
    }
    if (entry.status === 'OK') {
      return ok({ value: entry.value, unit: entry.unit });
    }
    return ok({ status: entry.status });
  } catch (e) {
    return fail('OBD_SERVICE_INDISPONIVEL', 'Não foi possível falar com o OBD Service local.');
  }
}

/** Estado geral da conexão OBD - porta, protocolo, PIDs suportados. */
export async function get_vehicle_status(): Promise<ToolResult<obd.StatusResponse>> {
  try {
    return ok(await obd.getStatus());
  } catch {
    return fail('OBD_SERVICE_INDISPONIVEL', 'Não foi possível falar com o OBD Service local.');
  }
}

/** Lista de PIDs que a ECU realmente confirmou suportar nesta conexão. */
export async function get_supported_pids(): Promise<ToolResult<string[]>> {
  const status = await obd.getStatus().catch(() => null);
  if (!status || status.state !== 'CONNECTED' || !status.profile) {
    return fail('NAO_CONECTADO', 'O veículo não está conectado ao Scanner OBD.');
  }
  return ok(status.profile.supportedPids);
}

export const read_rpm = () => readSinglePid('RPM');
export const read_coolant_temperature = () => readSinglePid('COOLANT_TEMP');
export const read_battery_voltage = () => readSinglePid('CONTROL_MODULE_VOLTAGE');
export const read_engine_load = () => readSinglePid('ENGINE_LOAD');
export const read_throttle_position = () => readSinglePid('THROTTLE_POSITION');
export const read_short_term_fuel_trim = () => readSinglePid('STFT_B1');
export const read_long_term_fuel_trim = () => readSinglePid('LTFT_B1');

/** Códigos de falha armazenados, com descrição apenas quando confirmada
 * (nunca inventa o significado de um código fora da tabela genérica SAE). */
export async function read_dtc(): Promise<ToolResult<obd.DtcEntry[]>> {
  try {
    const status = await obd.getStatus();
    if (status.state !== 'CONNECTED') {
      return fail('NAO_CONECTADO', 'O veículo não está conectado ao Scanner OBD.');
    }
    return ok(await obd.getDtc());
  } catch {
    return fail('OBD_SERVICE_INDISPONIVEL', 'Não foi possível falar com o OBD Service local.');
  }
}

export async function read_freeze_frame(): Promise<ToolResult<Record<string, obd.PidReading> | null>> {
  try {
    const status = await obd.getStatus();
    if (status.state !== 'CONNECTED') {
      return fail('NAO_CONECTADO', 'O veículo não está conectado ao Scanner OBD.');
    }
    return ok(await obd.getFreezeFrame());
  } catch {
    return fail('OBD_SERVICE_INDISPONIVEL', 'Não foi possível falar com o OBD Service local.');
  }
}

/** Sessões de diagnóstico anteriores (prontuário do veículo). */
export async function get_vehicle_history(limit = 20): Promise<ToolResult<Awaited<ReturnType<typeof getDiagnosticSessions>>>> {
  const sessions = await getDiagnosticSessions(limit);
  return ok(sessions);
}

/** Busca livre no manual (sistemas, peças, guias) - mesma lógica usada
 * pela busca do site, para que o agente e o usuário vejam os mesmos
 * resultados. */
export async function search_manual(query: string): Promise<ToolResult<Awaited<ReturnType<typeof searchAll>>>> {
  if (typeof query !== 'string' || query.trim().length === 0) {
    return fail('CONSULTA_VAZIA', 'Informe um termo de busca.');
  }
  return ok(await searchAll(query));
}

/** Recupera um procedimento técnico específico (guia de reparo) por id,
 * incluindo o nível de confiança e a aplicabilidade - o agente nunca deve
 * repassar um passo sem esse contexto. */
export async function get_technical_procedure(guideId: string): Promise<ToolResult<{
  guide: Awaited<ReturnType<typeof getGuideById>>;
  part: Awaited<ReturnType<typeof getPartById>> | null;
  system: Awaited<ReturnType<typeof getSystemById>> | null;
}>> {
  const guide = await getGuideById(guideId);
  if (!guide) {
    return fail('GUIA_NAO_ENCONTRADO', `Nenhum guia de reparo com id "${guideId}".`);
  }
  const part = await getPartById(guide.partId);
  const system = part ? await getSystemById(part.systemId) : null;
  return ok({ guide, part, system });
}

/**
 * Registro de ferramentas para uma futura integração com um provedor de
 * LLM (ex.: Anthropic Messages API com tool use). Isto NÃO está conectado
 * a nenhum modelo ainda - é só a lista com nome/descrição/handler que uma
 * integração real usaria, para deixar claro o escopo fixo de cada uma.
 */
export const AGENT_TOOLS = [
  { name: 'get_vehicle_status', description: 'Estado da conexão OBD (porta, protocolo, PIDs suportados).', handler: get_vehicle_status },
  { name: 'get_supported_pids', description: 'PIDs que a ECU confirmou suportar nesta conexão.', handler: get_supported_pids },
  { name: 'read_rpm', description: 'Rotação atual do motor (rpm).', handler: read_rpm },
  { name: 'read_coolant_temperature', description: 'Temperatura do líquido de arrefecimento (°C).', handler: read_coolant_temperature },
  { name: 'read_battery_voltage', description: 'Tensão do módulo de controle / bateria (V).', handler: read_battery_voltage },
  { name: 'read_engine_load', description: 'Carga calculada do motor (%).', handler: read_engine_load },
  { name: 'read_throttle_position', description: 'Posição da borboleta (%).', handler: read_throttle_position },
  { name: 'read_short_term_fuel_trim', description: 'Correção de combustível de curto prazo, banco 1 (%).', handler: read_short_term_fuel_trim },
  { name: 'read_long_term_fuel_trim', description: 'Correção de combustível de longo prazo, banco 1 (%).', handler: read_long_term_fuel_trim },
  { name: 'read_dtc', description: 'Códigos de falha armazenados.', handler: read_dtc },
  { name: 'read_freeze_frame', description: 'Dados capturados no momento da falha, se houver.', handler: read_freeze_frame },
  { name: 'get_vehicle_history', description: 'Sessões de diagnóstico anteriores.', handler: get_vehicle_history },
  { name: 'search_manual', description: 'Busca livre no manual técnico (sistemas, peças, guias).', handler: search_manual },
  { name: 'get_technical_procedure', description: 'Recupera um guia de reparo específico por id, com fonte e aplicabilidade.', handler: get_technical_procedure },
] as const;
