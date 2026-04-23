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
- **23 peças** com informações técnicas (código, OEM, marca, posição)
- **18 guias de reparo** com passo a passo detalhado (78 passos no total)
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

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Executar build de produção |
| `npm run lint` | Verificação TypeScript (tsc --noEmit) |
| `npm run typecheck` | Verificação TypeScript (tsc --noEmit) |
| `npx prisma migrate dev` | Aplicar mudanças no schema ao banco |
| `npx tsx prisma/seed.ts` | Repovoar banco com dados de `data/` |

---

## Arquitetura

### Modelo de Dados

```
Vehicle (1) ──< System (10)
                │
                └──< Part (23)
                      │
                      └──< Guide (18)
                            │
                            └──< GuideStep (78)

Vehicle (1) ──< CarView (6)
                 │
                 └──< Hotspot (12)
```

### Padrão de Dados

O projeto usa **dados híbridos**:
- **Banco SQLite** (via Prisma + LibSQL): entidades relacionais (vehicle, systems, parts, guides, views, hotspots)
- **Dados estáticos TypeScript** (`data/`): metadados ricos como symptoms, tools, materials, tips, warnings que não fazem sentido armazenar no banco relacional
- A função `parsePart()` e `parseGuide()` em `lib/selectors.ts` mescla dados do banco com dados estáticos

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

1. Troca de Óleo e Filtro
2. Filtro de Ar
3. Velas de Ignição
4. Bobinas de Ignição
5. Fluido de Arrefecimento
6. Radiador
7. Termostato
8. Ventoinha do Radiador
9. Filtro de Combustível
10. Palhetas do Limpador
11. Braços do Limpador
12. Bateria
13. Caixa de Fusíveis
14. Fusíveis
15. Lâmpada do Farol
16. Lâmpada da Lanterna Traseira
17. Lâmpada do Indicador de Direção
18. Pastilhas de Freio (Dianteiras e Traseiras)
19. Fluido de Freio
20. Amortecedores
21. Articulações da Suspensão

---

## Contribuindo

1. Execute `npm run lint && npm run typecheck` antes decommitar
2. Faça build local com `npm run build`
3. Abra um PR com descrição, screenshots de mudanças UI e validação dos comandos

---

## Licença

Privado — Uso interno.