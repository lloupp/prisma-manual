import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Client } from '@libsql/client';

type Database = Pick<Client, 'execute'>;
const initial = '20260419215146_init';
const traceability = '20260912142252_add_source_traceability';
const sessions = '20260912150933_add_diagnostic_session';
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';

function migration(name: string) {
  return readFileSync(join(process.cwd(), 'prisma/migrations', name, 'migration.sql'), 'utf8');
}

function tables(sql: string) {
  return [...sql.matchAll(/CREATE TABLE "([^"]+)" \([\s\S]*?\n\);/g)]
    .map(match => ({ name: match[1], sql: match[0] }));
}

async function columns(db: Database, table: string) {
  const result = await db.execute(`PRAGMA table_info(${quote(table)})`);
  return new Set(result.rows.map(row => String(row.name)));
}

async function assertColumns(db: Database, table: { name: string; sql: string }) {
  const found = await columns(db, table.name);
  const required = [...table.sql.matchAll(/^\s+"([^"]+)" /gm)].map(match => match[1]);
  if (required.some(name => !found.has(name))) {
    throw new Error(`Schema inesperado em ${table.name}. Interrompido sem recriar tabelas.`);
  }
}

/** Targeted additive repair of the September 12 preview schema, not a general migration runner. */
export async function previewSchemaPlan(db: Database): Promise<string[]> {
  // A fresh/foreign database must be initialized deliberately, not silently adopted.
  for (const table of tables(migration(initial))) await assertColumns(db, table);
  const plan: string[] = [];
  const trace = migration(traceability);
  for (const table of [...tables(trace).filter(table => !table.name.startsWith('new_')), ...tables(migration(sessions))]) {
    if (!(await columns(db, table.name)).size) plan.push(table.sql);
    else await assertColumns(db, table);
  }
  const additions: Array<[string, string, string]> = [
    ['Part', 'confidence', "TEXT NOT NULL DEFAULT 'UNVERIFIED'"],
    ['Guide', 'confidence', "TEXT NOT NULL DEFAULT 'UNVERIFIED'"],
    ['Guide', 'applicability', "TEXT NOT NULL DEFAULT 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010, câmbio manual 5 marchas'"],
    ['DiagnosticSession', 'diagnosticSamples', 'TEXT'],
    ['DiagnosticSession', 'hypothesesSnapshot', 'TEXT'],
    ['DiagnosticSession', 'reportedTests', 'TEXT'],
  ];
  for (const [table, column, definition] of additions) {
    if (!(await columns(db, table)).has(column)) {
      plan.push(`ALTER TABLE ${quote(table)} ADD COLUMN ${quote(column)} ${definition}`);
    }
  }
  for (const match of (trace + migration(sessions)).matchAll(/CREATE INDEX "([^"]+)" ON "([^"]+)"[^;]+;/g)) {
    const existing = await db.execute({ sql: "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?", args: [match[1]] });
    if (!existing.rows.length) plan.push(match[0]);
  }
  return plan;
}

export async function applyPreviewSchema(client: Client) {
  const tx = await client.transaction('write');
  try {
    if ((await tx.execute('PRAGMA foreign_key_check')).rows.length) {
      throw new Error('O banco já contém referências inválidas. Corrija antes da atualização.');
    }
    const existing = (await tx.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"))
      .rows.map(row => String(row.name));
    const before = new Map<string, number>();
    for (const name of existing) {
      before.set(name, Number((await tx.execute(`SELECT COUNT(*) AS n FROM ${quote(name)}`)).rows[0].n));
    }
    // Build the plan under the same write transaction, avoiding a check/apply race.
    const plan = await previewSchemaPlan(tx);
    for (const sql of plan) await tx.execute(sql);
    for (const [name, count] of before) {
      if (Number((await tx.execute(`SELECT COUNT(*) AS n FROM ${quote(name)}`)).rows[0].n) !== count) {
        throw new Error(`Contagem alterada em ${name}. Atualização revertida.`);
      }
    }
    if ((await tx.execute('PRAGMA foreign_key_check')).rows.length) {
      throw new Error('Referências inválidas após atualização. Atualização revertida.');
    }
    if ((await previewSchemaPlan(tx)).length) throw new Error('Schema incompleto. Atualização revertida.');
    await tx.commit();
    return plan.length;
  } catch (error) {
    if (!tx.closed) await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
