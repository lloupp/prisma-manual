import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { databaseConfig } from '../lib/database-config';
import { applyPreviewSchema, previewSchemaPlan } from '../scripts/preview-schema';

const resources: Array<{ client: Client; directory: string }> = [];
async function oldDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'preview-db-'));
  const url = `file:${join(directory, 'test.db')}`;
  const client = createClient({ url });
  resources.push({ client, directory });
  await client.executeMultiple(readFileSync('prisma/migrations/20260419215146_init/migration.sql', 'utf8'));
  await client.executeMultiple(readFileSync('prisma/seed.sql', 'utf8'));
  return { client, url };
}
afterEach(() => {
  vi.restoreAllMocks();
  for (const { client, directory } of resources.splice(0)) {
    client.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Configuração do banco', () => {
  it('mantém SQLite local e prioriza Turso sem expor credenciais em erros', () => {
    expect(databaseConfig({})).toEqual({ url: 'file:./dev.db' });
    expect(databaseConfig({ TURSO_DATABASE_URL: 'libsql://preview.example', TURSO_AUTH_TOKEN: 'test-token', DATABASE_URL: 'file:dev.db' }))
      .toEqual({ url: 'libsql://preview.example', authToken: 'test-token' });
    expect(() => databaseConfig({ VERCEL: '1' })).toThrow('Configure um banco Turso');
    expect(() => databaseConfig({ VERCEL: '1', DATABASE_URL: 'file:dev.db' })).toThrow('Configure um banco Turso');
    expect(() => databaseConfig({ TURSO_DATABASE_URL: 'libsql://preview.example' })).toThrow('TURSO_AUTH_TOKEN ausente');
  });
});

describe('Recuperação aditiva do Preview', () => {
  it('reproduz o erro antigo, preserva todas as linhas e pode ser repetida', async () => {
    const { client } = await oldDatabase();
    await expect(client.execute('SELECT confidence FROM Part')).rejects.toThrow('no such column');
    await expect(client.execute('SELECT * FROM Specification')).rejects.toThrow('no such table');
    const original = new Map<string, unknown>();
    for (const table of ['Vehicle', 'System', 'Part', 'Guide', 'GuideStep', 'User']) {
      original.set(table, (await client.execute(`SELECT * FROM "${table}" ORDER BY id`)).rows);
    }
    expect((await previewSchemaPlan(client)).length).toBeGreaterThan(0);
    // Planning must not mutate anything.
    await expect(client.execute('SELECT confidence FROM Part')).rejects.toThrow();
    await applyPreviewSchema(client);
    for (const [table, before] of original) {
      const keys = Object.keys((before as Record<string, unknown>[])[0]);
      expect((await client.execute(`SELECT ${keys.map(key => '"' + key + '"').join(',')} FROM "${table}" ORDER BY id`)).rows).toEqual(before);
    }
    expect((await client.execute('SELECT COUNT(*) AS n FROM GuideStep')).rows[0].n).toBe(216);
    expect((await client.execute('PRAGMA foreign_key_check')).rows).toEqual([]);
    expect(await previewSchemaPlan(client)).toEqual([]);
    expect(await applyPreviewSchema(client)).toBe(0);
  });

  it('reverte alterações anteriores se uma instrução falhar', async () => {
    const { client } = await oldDatabase();
    const transaction = client.transaction.bind(client);
    vi.spyOn(client, 'transaction').mockImplementation(async (mode?: 'write' | 'read' | 'deferred') => {
      const tx = await transaction(mode);
      const execute = tx.execute.bind(tx);
      vi.spyOn(tx, 'execute').mockImplementation(async statement => {
        if (typeof statement === 'string' && statement.startsWith('CREATE TABLE "SourceReference"')) throw new Error('falha simulada');
        return execute(statement);
      });
      return tx;
    });
    await expect(applyPreviewSchema(client)).rejects.toThrow('falha simulada');
    expect((await client.execute("SELECT name FROM sqlite_master WHERE name = 'Source'")).rows).toEqual([]);
    expect((await client.execute('SELECT COUNT(*) AS n FROM GuideStep')).rows[0].n).toBe(216);
  });

  it('recusa banco desconhecido sem criar tabelas', async () => {
    const client = createClient({ url: ':memory:' });
    try {
      await expect(applyPreviewSchema(client)).rejects.toThrow('Schema inesperado');
      expect((await client.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows).toEqual([]);
    } finally { client.close(); }
  });

  it('carga incremental usa o destino configurado e preserva usuários, histórico e linhas extras', async () => {
    const { client, url } = await oldDatabase();
    await applyPreviewSchema(client);
    await client.execute("INSERT INTO DiagnosticSession (id, port, supportedPids, dtcs, notes) VALUES ('session-preserve', 'fixture', '[]', '[]', 'não alterar')");
    await client.execute("INSERT INTO Source (id,title,publisher,documentType,updatedAt) VALUES ('source-extra','Extra','User','OTHER',CURRENT_TIMESTAMP)");
    const users = (await client.execute('SELECT * FROM User ORDER BY id')).rows;
    const history = (await client.execute('SELECT * FROM DiagnosticSession ORDER BY id')).rows;
    const extra = (await client.execute("SELECT * FROM Source WHERE id='source-extra'")).rows;
    const runSeed = () => execFileSync(process.execPath, ['--import', 'tsx', 'prisma/seed.ts'], {
      env: { ...process.env, DATABASE_URL: url, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', VERCEL: '' },
      stdio: 'pipe', timeout: 30000,
    });
    runSeed();
    const count = (await client.execute('SELECT COUNT(*) AS n FROM Source')).rows[0].n;
    runSeed();
    expect((await client.execute('SELECT COUNT(*) AS n FROM Source')).rows[0].n).toBe(count);
    expect(Number(count)).toBeGreaterThan(1);
    expect((await client.execute('SELECT * FROM User ORDER BY id')).rows).toEqual(users);
    expect((await client.execute('SELECT * FROM DiagnosticSession ORDER BY id')).rows).toEqual(history);
    expect((await client.execute("SELECT * FROM Source WHERE id='source-extra'")).rows).toEqual(extra);
    expect((await client.execute('PRAGMA foreign_key_check')).rows).toEqual([]);
  }, 60000);
});
