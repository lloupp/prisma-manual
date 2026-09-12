import { TorqueSpecification } from '../types';

// Intencionalmente vazio: nenhum torque de aperto foi confirmado nesta
// pesquisa em fonte oficial. O Manual do Proprietário Chevrolet Prisma
// (ver data/sources.ts) não traz tabela de torques - esse dado pertence ao
// Manual de Reparação/Oficina da GM, que não é publicado gratuitamente.
// Nunca adicione uma linha aqui sem uma fonte real correspondente em
// data/source-references.ts (ver validação em prisma/validate-content.ts).
export const torqueSpecifications: TorqueSpecification[] = [];
