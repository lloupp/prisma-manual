// Prova, no lado do app Next.js, que a camada de ferramentas do agente
// (lib/agent-tools.ts) é fechada: só existem as ferramentas de leitura
// esperadas, nenhuma aceita um comando bruto, e nenhum arquivo do projeto
// (fora do obd-service, já coberto pelos próprios testes dele) expõe uma
// função de escrita/atuador. Complementa obd-service/test/writeSafety.test.ts.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGENT_TOOLS } from '../lib/agent-tools';

const EXPECTED_TOOL_NAMES = [
  'get_vehicle_status',
  'get_supported_pids',
  'read_rpm',
  'read_coolant_temperature',
  'read_battery_voltage',
  'read_engine_load',
  'read_throttle_position',
  'read_short_term_fuel_trim',
  'read_long_term_fuel_trim',
  'read_dtc',
  'read_freeze_frame',
  'get_vehicle_history',
  'search_manual',
  'get_technical_procedure',
].sort();

const FORBIDDEN_IDENTIFIERS = [
  'clearDtc', 'clear_dtc', 'CLEAR_DTC',
  'ecuWrite', 'ecu_write', 'writeEcu',
  'ecuFlash', 'ecu_flash', 'flashEcu',
  'actuatorControl', 'actuator_control',
  'rawCanSend', 'raw_can_send', 'sendRawCommand',
];

describe('AGENT_TOOLS - camada de ferramentas do agente é fechada', () => {
  it('só existem exatamente as ferramentas esperadas, nenhuma a mais', () => {
    const names = AGENT_TOOLS.map(t => t.name).sort();
    expect(names).toEqual(EXPECTED_TOOL_NAMES);
  });

  it('cada ferramenta é uma função (handler executável)', () => {
    for (const tool of AGENT_TOOLS) {
      expect(typeof tool.handler).toBe('function');
    }
  });

  it('nenhuma ferramenta aceita um parâmetro que pareça um comando bruto', () => {
    // Verificação estrutural: nenhuma função declarada tem uma assinatura
    // com mais de 2 parâmetros (a maioria não tem nenhum; get_vehicle_history
    // tem um limite numérico opcional; search_manual/get_technical_procedure
    // recebem uma string simples de busca/id - nunca um objeto "comando").
    for (const tool of AGENT_TOOLS) {
      expect(tool.handler.length).toBeLessThanOrEqual(1);
    }
  });
});

const THIS_FILE = __filename;

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'obd-service') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(full));
    // Exclui este próprio arquivo: ele lista os identificadores proibidos
    // como dado de teste, o que faria o scan se autodetectar como "ofensor".
    else if (/\.(ts|tsx)$/.test(entry.name) && full !== THIS_FILE) files.push(full);
  }
  return files;
}

describe('Nenhum identificador de escrita/atuador aparece no app Next.js', () => {
  const files = listSourceFiles(join(__dirname, '..'));

  it('encontrou arquivos para analisar (sanidade)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN_IDENTIFIERS)('"%s" não aparece em nenhum arquivo do app', (forbidden) => {
    const offenders = files.filter(file => readFileSync(file, 'utf-8').includes(forbidden));
    expect(offenders).toEqual([]);
  });
});
