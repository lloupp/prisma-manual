/** Shared by the app and database commands; never log the returned credentials. */
export function databaseConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.TURSO_DATABASE_URL?.trim() || env.DATABASE_URL?.trim();
  if (env.VERCEL && (!url || url.startsWith('file:'))) {
    throw new Error('Configure um banco Turso persistente nas variáveis do ambiente Vercel (Preview/Production). SQLite local só é permitido fora da Vercel.');
  }
  const authToken = env.TURSO_AUTH_TOKEN?.trim();
  if (url?.startsWith('libsql:') && !authToken) {
    throw new Error('TURSO_AUTH_TOKEN ausente para o banco Turso configurado.');
  }
  return { url: url || 'file:./dev.db', ...(authToken ? { authToken } : {}) };
}
