# Recuperação do banco de Preview

## Evidência e limite do diagnóstico

O deploy de `5bf992e` passou; o de `4cb4761` falhou depois da inclusão da
rastreabilidade. `faaa7ee` continua com status Vercel `failure`.
Uma compilação local do código de `faaa7ee`, usando o schema inicial e os
dados de `prisma/seed.sql`, falha na página inicial com
`SQLITE_ERROR: no such column: main.Part.confidence`.
Isso reproduz a hipótese de schema desatualizado. Sem os logs e as variáveis
do deploy remoto, não confirma a causa histórica na Vercel.

## Procedimento no banco correto

1. Confira o primeiro erro dos logs do deploy. Se ele ocorrer antes das
   consultas SQL (instalação, geração do cliente, TypeScript), investigue esse
   erro antes de alterar o banco. Confira o destino e as variáveis de Preview,
   incluindo overrides para `claude/gauntlet-loop-quality-h5ayf4`.
2. Use um banco de Preview separado de produção e uma cópia recuperável antes
   da atualização. Configure `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no shell
   autorizado ou em `.env`, sem versionar credenciais. Os comandos e a aplicação
   usam a mesma resolução de configuração. `DATABASE_URL=file:...` é permitido
   para a reprodução local, mas não para a aplicação hospedada na Vercel.
3. Execute na raiz do repositório:

   ```sh
   npm ci
   npx prisma generate
   npm run db:preview:plan
   ```

   O último comando só lê o schema e mostra as instruções pendentes. Ele exige
   que o banco já contenha o schema inicial de abril. Um banco vazio precisa ser
   inicializado separadamente. Não aplica nem registra migrações Prisma.
4. Após revisar o plano e confirmar o destino:

   ```sh
   npm run db:preview:apply
   npm run db:seed
   npm run db:check
   npm run build:vercel
   ```

   `db:preview:apply` é uma recuperação específica das três alterações de
   setembro: cria as tabelas/índices ausentes e acrescenta as seis colunas novas
   de `Part`, `Guide` e `DiagnosticSession`. Não executa `DROP TABLE`, não desliga
   chaves estrangeiras e não recria `Part`/`Guide`. Planeja e aplica dentro da
   mesma transação de escrita; verifica contagens e referências antes do commit.
   Falhas revertem a transação. Reexecutar em schema atualizado não altera nada.

   Esse procedimento substitui a aplicação dos três SQLs originais no Turso
   para esse reparo. Não aplique os mesmos SQLs originais depois dele: eles
   tentariam recriar estruturas já existentes. Não altera `_prisma_migrations`;
   registre operacionalmente o reparo e mantenha as próximas migrações do Turso
   no fluxo SQL próprio do serviço. As migrações Prisma locais permanecem intactas.

   `db:seed` atualiza os IDs de catálogo presentes em `data/` e insere os
   ausentes. Mantém registros extras e nunca altera `User` ou `DiagnosticSession`.
   Não é uma transação única: se a carga for interrompida, pode ser repetida para
   terminar os upserts. Não cria mais o usuário demonstrativo com senha fictícia.

5. Dispare um novo Preview e confirme estado `READY`. Verifique `/`,
   `/especificacoes`, uma rota de peça e de guia, `/sitemap.xml` e `/historico`.
   Verifique que as sessões existentes continuam presentes. O scanner ainda
   depende de `obd-service` na máquina do usuário; ele não deve rodar na Vercel.

O build da Vercel executa apenas geração do cliente, verificação **somente
leitura** do banco e compilação. Não aplica migrações nem seed automaticamente.

Referência: https://docs.turso.tech/sdk/ts/orm/prisma

## Validação realizada

- Build anterior falhou em `Part.confidence` usando o schema inicial populado.
- Recuperação aplicada localmente: 20 instruções aditivas, sem perda dos 49
  registros de peças, 49 guias e 216 passos originais.
- Testes verificam planejamento somente leitura, repetição sem alterações,
  rollback de falha intermediária e preservação de usuários/histórico/linhas extras.
- 102 testes da raiz e 101 do OBD Service passaram, assim como lint e TypeScript.
- Após recuperação e carga incremental, `npm run build:vercel` passou.
- Sete rotas responderam HTTP 200 no build de produção local: `/`,
  `/especificacoes`, `/parts/part-oil-filter`, `/guides/guide-oil-filter`,
  `/sitemap.xml`, `/historico` e `/api/diagnostic-sessions`. Uma sessão de teste
  apareceu no histórico e na API.
- Aplicação no Turso remoto e estado `READY` na Vercel continuam pendentes de
  acesso; não foram validados por esta execução.
