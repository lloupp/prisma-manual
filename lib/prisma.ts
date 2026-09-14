import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Set it to your Supabase Postgres pooled (transaction mode, port 6543) connection string.');
  }

  const adapter = new PrismaPg({ connectionString: url });
  _prisma = new PrismaClient({ adapter } as any);
  return _prisma;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? getPrisma();

if (process.env.NODE_ENV !== 'production') {
  (globalForPrisma as any).prisma = prisma;
}
