// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
  _prisma = new PrismaClient({ adapter } as any);
  return _prisma;
}

// Synchronous access via caching (first call blocks, subsequent calls return cached)
export const prisma: PrismaClient = globalForPrisma.prisma ?? getPrisma();

if (process.env.NODE_ENV !== 'production') {
  (globalForPrisma as any).prisma = prisma;
}
