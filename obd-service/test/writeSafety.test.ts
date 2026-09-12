import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SimulatorTransport } from '../src/transport/SimulatorTransport';
import { SerialTransport } from '../src/transport/SerialTransport';

/**
 * Prova, de duas formas independentes, que nenhuma API de escrita/atuador
 * existe neste serviço - não apenas que ela "está bloqueada por uma regra",
 * mas que a função nem existe (item 34 do escopo: "se essas APIs nem
 * existirem, melhor ainda").
 */

const FORBIDDEN_NAMES = [
  'clearDtc', 'clear_dtc', 'CLEAR_DTC',
  'ecuWrite', 'ecu_write', 'ECU_WRITE', 'writeEcu',
  'ecuFlash', 'ecu_flash', 'ECU_FLASH', 'flashEcu',
  'actuatorControl', 'actuator_control', 'ACTUATOR_CONTROL',
  'rawCanSend', 'raw_can_send', 'RAW_CAN_SEND', 'sendRaw',
];

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(full));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

describe('Nenhuma API de escrita/atuador existe no código-fonte', () => {
  const srcDir = join(__dirname, '..', 'src');
  const files = listSourceFiles(srcDir);

  it('encontrou arquivos-fonte para analisar (sanidade do próprio teste)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN_NAMES)('o identificador "%s" não aparece em nenhum arquivo de src/', (forbidden) => {
    const offenders = files.filter(file => readFileSync(file, 'utf-8').includes(forbidden));
    expect(offenders).toEqual([]);
  });
});

describe('Nenhum transporte expõe um método de escrita em runtime', () => {
  const forbiddenMethodNames = [
    'clearDtc', 'writeEcu', 'ecuFlash', 'actuatorControl', 'rawCanSend', 'sendRaw', 'write', 'flash',
  ];

  it('SimulatorTransport não tem nenhum método de escrita na sua interface pública', () => {
    const instance = new SimulatorTransport('idle-healthy');
    const publicMethods = getAllMethodNames(instance);
    const offending = publicMethods.filter(m => forbiddenMethodNames.includes(m));
    expect(offending).toEqual([]);
  });

  it('SerialTransport não tem nenhum método de escrita na sua interface pública', () => {
    const instance = new SerialTransport();
    const publicMethods = getAllMethodNames(instance);
    const offending = publicMethods.filter(m => forbiddenMethodNames.includes(m));
    expect(offending).toEqual([]);
  });

  it('a única forma de mandar qualquer coisa para o veículo é send(), e ela sempre valida contra o allowlist', () => {
    const instance = new SimulatorTransport('idle-healthy');
    const publicMethods = getAllMethodNames(instance);
    const sendLikeMethods = publicMethods.filter(m => /send|write|command|exec/i.test(m));
    expect(sendLikeMethods).toEqual(['send']);
  });
});

function getAllMethodNames(instance: object): string[] {
  const names = new Set<string>();
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name !== 'constructor') names.add(name);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return Array.from(names);
}
