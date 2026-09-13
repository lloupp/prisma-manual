import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { databaseConfig } from '../lib/database-config';

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaLibSql(databaseConfig()) });
  try {
    // Full model selections validate columns even when the table is empty.
    const checks = {
      Vehicle: () => prisma.vehicle.findFirst(), System: () => prisma.system.findFirst(),
      Part: () => prisma.part.findFirst(), Guide: () => prisma.guide.findFirst(),
      GuideStep: () => prisma.guideStep.findFirst(), CarView: () => prisma.carView.findFirst(),
      Hotspot: () => prisma.hotspot.findFirst(), Source: () => prisma.source.findFirst(),
      SourceReference: () => prisma.sourceReference.findFirst(), Specification: () => prisma.specification.findFirst(),
      FluidSpecification: () => prisma.fluidSpecification.findFirst(), MaintenanceInterval: () => prisma.maintenanceInterval.findFirst(),
      TorqueSpecification: () => prisma.torqueSpecification.findFirst(), DiagnosticSession: () => prisma.diagnosticSession.findFirst(),
    };
    for (const [table, query] of Object.entries(checks)) {
      try { await query(); }
      catch { throw new Error(`Falha na consulta de ${table}. Confira conexão, credenciais e colunas dessa tabela.`); }
    }
    const [vehicles, systems, parts, guides] = await Promise.all([
      prisma.vehicle.count(), prisma.system.count(), prisma.part.count(), prisma.guide.count(),
    ]);
    if (!vehicles || !systems || !parts || !guides) {
      throw new Error('O banco está acessível, mas faltam dados do manual. Execute npm run db:seed no banco correto.');
    }
    console.log('Banco acessível, schema compatível e manual presente.', { vehicles, systems, parts, guides });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  // Driver errors can contain connection details. Keep build logs credential-free.
  console.error('Verificação do banco falhou. Confira URL/token do ambiente, as migrações pendentes (npm run db:preview:plan) e a carga do manual.');
  if (error instanceof Error && (error.message.startsWith('Falha na consulta de ') || error.message.startsWith('O banco está acessível'))) {
    console.error(error.message);
  }
  process.exitCode = 1;
});
