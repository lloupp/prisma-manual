import { defineConfig } from 'vitest/config';

// obd-service/ é um pacote Node separado com seu próprio package.json,
// node_modules e suíte de testes (`cd obd-service && npm test`). Excluímos
// aqui para manter os dois projetos independentes - o vitest da raiz não
// deve depender de dependências (serialport, ws) que só existem dentro de
// obd-service/node_modules.
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', 'obd-service/**'],
    setupFiles: ['dotenv/config'],
  },
});
