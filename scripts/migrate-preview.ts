import 'dotenv/config';
import { createClient } from '@libsql/client';
import { databaseConfig } from '../lib/database-config';
import { applyPreviewSchema, previewSchemaPlan } from './preview-schema';

async function main() {
  if (process.env.VERCEL_ENV === 'production') throw new Error('Este comando é destinado à recuperação do Preview.');
  if (!process.env.TURSO_DATABASE_URL?.trim() && !process.env.DATABASE_URL?.trim()) {
    throw new Error('Defina explicitamente o banco de destino.');
  }
  const client = createClient(databaseConfig());
  try {
    if (process.argv.includes('--apply')) {
      const count = await applyPreviewSchema(client);
      console.log(`${count} alterações aplicadas. Registros existentes preservados.`);
    } else {
      const plan = await previewSchemaPlan(client);
      console.log(plan.length ? plan.join(';\n') : 'Schema atualizado; nenhuma alteração necessária.');
      console.log('Somente leitura. Para aplicar no banco configurado: npm run db:preview:apply');
    }
  } finally {
    client.close();
  }
}

main().catch(() => {
  console.error('Recuperação interrompida. Confira destino, credenciais, schema inicial e integridade das referências. Nenhuma alteração parcial será mantida.');
  process.exitCode = 1;
});
