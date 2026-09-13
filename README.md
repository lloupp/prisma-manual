# Manual de Manutenção Prisma

Aplicação web interativa de manual de manutenção automotiva para o **Chevrolet Prisma 1.0 Maxx 2009/2010**.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-5A67D8?style=flat-square&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Começando](#começando)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Rotas](#rotas)
- [Dados do Veículo](#dados-do-veículo)
- [Contribuindo](#contribuindo)

---

## Visão Geral

Manual de manutenção interativo com:
- **10 sistemas de manutenção** catalogados (óleo, arrefecimento, freios, suspensão, etc.)
- **49 peças** com informações técnicas (código, OEM, marca, posição)
- **49 guias de reparo** com passo a passo detalhado (216 passos no total)
- **Busca inteligente** com normalização de acentos em português
- **Navegação hierárquica**: Sistema → Peça → Guia
- **Visualização 3D** do veículo com hotspots interativos (6 vistas, 12 hotspots)

---

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 6 |
| Estilização | Tailwind CSS + Lucide React |
| Banco de dados | SQLite via Prisma 7 + LibSQL adapter |
| UI | Radix-like primitives, theming com next-themes |

---

## Estrutura do Projeto

```
prisma-manual/
├── app/                          # Rotas Next.js (App Router)
│   ├── page.tsx                  # Homepage - lista de categorias
│   ├── layout.tsx                # Layout raiz
│   ├── globals.css               # Estilos globais
│   ├── search/page.tsx           # Página de busca
│   ├── systems/[id]/page.tsx     # Detalhes de sistema
│   ├── parts/[id]/page.tsx       # Detalhes de peça
│   └── guides/[id]/page.tsx      # Guia de reparo
├── components/                   # Componentes React
│   ├── badges/                   # DifficultyBadge, TimeBadge
│   ├── cards/                    # CategoryCard, InfoCard, CarPreviewCard
│   ├── car/                      # CarViewer3D
│   ├── layout/                   # AppHeader, AppShell, ThemeProviders
│   └── search/                   # SearchBar
├── data/                         # Dados estáticos do veículo
│   ├── vehicle.ts                # Especificações do Prisma
│   ├── systems.ts                # 10 sistemas de manutenção
│   ├── parts.ts                  # 23 peças
│   ├── guides.ts                 # 18 guias com passos
│   ├── views.ts                  # 6 vistas do carro
│   └── hotspots.ts               # 12 hotspots interativos
├── lib/                          # Utilitários
│   ├── prisma.ts                 # Cliente Prisma singleton
│   ├── selectors.ts              # Funções de acesso a dados
│   ├── search.ts                 # Lógica de busca
│   ├── utils.ts                  # Helpers (formatação de tempo)
│   └── guide-images.ts           # Mapeamento de imagens dos guias
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Schema do banco
│   ├── seed.ts                   # Script de seed
│   └── dev.db                    # Banco SQLite local
├── public/images/guides/         # Imagens SVG dos guias
├── types/                        # Tipos TypeScript
└── .env                          # Variáveis de ambiente (não versionar)
```

---

## Começando

### Pré-requisitos

- Node.js 20+
- npm ou bun

### Instalação

```bash
# Clonar o repositório
git clone <url-do-repo>
cd prisma-manual

# Instalar dependências
npm install

# Aplicar migrations e popular banco
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# Iniciar servidor dev
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

### Build de produção

```bash
npm run build
npm run start
```

---

## Scripts Disponíveis

Para corrigir previews com banco desatualizado, siga o
[procedimento de recuperação](docs/preview-database-recovery.md).
`npm run db:preview:plan` inspeciona sem alterar; `db:preview:apply` aplica a
atualização aditiva; `db:seed` atualiza o catálogo sem exclusões; `db:check`
valida conexão, schema e presença do manual. O build Vercel não modifica o banco.

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Executar build de produção |
| `npm run lint` | ESLint (eslint-config-next) |
| `npm run typecheck` | Verificação TypeScript (tsc --noEmit) |
| `npm run test` | Testes de integridade de conteúdo (vitest) — ver AGENTS.md |
| `npx prisma migrate dev` | Aplicar mudanças no schema ao banco |
| `npm run db:seed` | Atualizar catálogo no banco configurado, preservando registros extras, usuários e histórico |

---

## Arquitetura

### Modelo de Dados

```
Vehicle (1) ──< System (10)
                │
                └──< Part (49)
                      │
                      └──< Guide (49)
                            │
                            └──< GuideStep (216)

Vehicle (1) ──< CarView (6)
                 │
                 └──< Hotspot (12)

Source (1) ──< SourceReference (>=1 por especificação/peça verificada)
                │
                ├─ referencia Part
                ├─ referencia Specification
                ├─ referencia FluidSpecification
                ├─ referencia MaintenanceInterval
                └─ referencia TorqueSpecification
```

### Padrão de Dados

O projeto usa **dados híbridos**:
- **Banco SQLite** (via Prisma + LibSQL): entidades relacionais (vehicle, systems, parts, guides, views, hotspots, specifications, fluid specifications, maintenance intervals, torque specifications, sources)
- **Dados estáticos TypeScript** (`data/`): metadados ricos como symptoms, tools, materials, tips, warnings que não fazem sentido armazenar no banco relacional
- A função `parsePart()` e `parseGuide()` em `lib/selectors.ts` mescla dados do banco com dados estáticos

### Rastreabilidade Técnica

Toda especificação (torque, fluido, capacidade, intervalo, código de peça) tem um campo `confidence`
(`OFFICIAL` / `OEM` / `CROSS_VERIFIED` / `UNVERIFIED`) e pode referenciar uma ou mais `Source` através
de `SourceReference` — ver os models em `prisma/schema.prisma`. `UNVERIFIED` é o padrão e nunca deve
aparecer como fato confirmado na UI (componente `ConfidenceBadge`); a fonte usada nesta pesquisa está
documentada em `data/sources.ts`, e o mapeamento de cada afirmação para sua página exata está em
`data/source-references.ts`. `npm run test` valida automaticamente que nenhuma linha com confiança
acima de `UNVERIFIED` fica sem fonte — ver `tests/content-integrity.test.ts` e a seção "Testing
Guidelines" do AGENTS.md.

### Busca

Normalização de texto em português: remoção de acentos usando `normalize('NFD')` + regex `/\u0300-\u036f/g`. Busca em: nome, descrição, código, marca, sintomas, ferramentas e materiais.

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Homepage com 10 categorias de sistemas |
| `/systems/[id]` | Lista de peças do sistema selecionado |
| `/parts/[id]` | Detalhes da peça + guias disponíveis |
| `/guides/[id]` | Guia completo com passo a passo |
| `/search?q=` | Busca por sistemas, peças e guias |
| `/especificacoes` | Especificações gerais, fluidos, plano de manutenção preventiva e torques, cada um com fonte citada |
| `/scanner` | Scanner OBD-II: conecta ao [OBD Service](#scanner-obd-ii) local, mostra dados ao vivo, gráficos e DTC/freeze frame |
| `/historico` | Prontuário do veículo: sessões de diagnóstico OBD anteriores |

---

## Scanner OBD-II

O Scanner lê dados reais do carro através de um adaptador OBD-USB, mas o navegador nunca fala com a porta serial diretamente. Há um serviço local separado:

```
Prisma → adaptador OBD-USB → porta serial → obd-service (processo Node local)
       → HTTP/WebSocket (localhost:4405) → app Next.js (/scanner)
```

- **Para usar**: `cd obd-service && npm install && npm run dev` (inicia em modo simulador por padrão, sem precisar do carro conectado), depois abra `/scanner`.
- **Somente leitura**: não existe, em nenhum lugar do código, uma função para apagar DTC, escrever na ECU ou controlar atuadores - a interface de transporte simplesmente não tem esse método, e um segundo checador em runtime rejeita qualquer coisa fora do allowlist de leitura.
- **Adaptador real ainda não testado em hardware**: o transporte serial segue a documentação pública do protocolo ELM327/OBD-II, mas este ambiente de desenvolvimento não tem porta serial para validar contra um adaptador físico. Veja `obd-service/README.md` e `AGENTS.md` (seção "OBD Scanner Architecture") para detalhes, limitações e o que falta antes da próxima fase (diagnóstico guiado por IA, análise de tendências).

---

## Dados do Veículo

- **Modelo**: Chevrolet Prisma 1.0 Maxx
- **Ano/Modelo**: 2009/2010
- **Motor**: GM 1.0L 8V Flexpower (999cm³)
- **Combustível**: Gasolina/Etanol
- **Transmissão**: Manual 5 Marchas

### Especificações de Manutenção

| Item | Especificação |
|------|---------------|
| Óleo | Semi Sintético 5W30 (3,75L) |
| Filtro de óleo | Rosca M22x1.5 |
| Velas | NGK BPR6ES (x4) |
| Bateria | 12V / 50Ah |
| Fluido arrefecimento | 4,5L (adesivo OEM) |
| Fluido de freio | DOT 4 |
| Palhetas | 18 polegadas / 450mm |

---

## Guias de Reparo Disponíveis

| Sistema | Guias |
|---------|-------|
| Óleo do Motor | Troca do Filtro de Óleo · Vedador do Bujão do Cárter · Junta do Cárter · Coxins do Motor · Fluido do Câmbio Manual |
| Ar do Motor | Filtro de Ar · Limpeza do Corpo de Borboleta · Válvula PCV |
| Ignição | Velas de Ignição · Bobinas de Ignição · Correia Dentada · Cabo de Embreagem · Junta da Tampa de Válvulas |
| Arrefecimento | Líquido de Arrefecimento · Radiador · Termostato · Eletroventilador · Bomba D'água · Mangueiras do Radiador |
| Combustível | Filtro de Combustível · Bomba de Combustível · Injetores de Combustível · Sensor Lambda/O2 |
| Palhetas | Palhetas do Limpador · Braços do Limpador · Fluido do Limpador |
| Elétrico | Bateria · Caixa de Fusíveis · Fusíveis · Alternador · Motor de Partida |
| Iluminação | Lâmpada do Farol · Lâmpada da Lanterna Traseira · Lâmpada do Indicador de Direção · Lâmpada de Ré · Lâmpada da Placa |
| Freios | Pastilhas Dianteiras · Pastilhas Traseiras · Fluido de Freio · Disco de Freio Dianteiro · Tambor de Freio Traseiro · Cabo do Freio de Mão |
| Suspensão | Amortecedores · Articulações da Suspensão · Coifas do Homocinético · Fluido da Direção Hidráulica · Terminais de Direção · Buchas da Barra Estabilizadora · Rolamentos de Roda |

Lista completa e atualizada em [`data/guides.ts`](data/guides.ts).

---

## Contribuindo

1. Execute `npm run lint && npm run typecheck` antes decommitar
2. Faça build local com `npm run build`
3. Abra um PR com descrição, screenshots de mudanças UI e validação dos comandos

---

## Licença

Privado — Uso interno.
