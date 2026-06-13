import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./dev.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url });
  _prisma = new PrismaClient({ adapter } as any);
  return _prisma;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? getPrisma();

if (process.env.NODE_ENV !== 'production') {
  (globalForPrisma as any).prisma = prisma;
}
