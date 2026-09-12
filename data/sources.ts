import { Source } from '../types';

// Fonte primária confirmada nesta pesquisa: Manual do Proprietário oficial
// Chevrolet Prisma, edição que cobre especificamente o motor 1.0L MPFI
// Flexpower (Seção 12 traz uma tabela separada para 1.0L vs. 1.4L). As
// páginas internas trazem as marcações "Prisma, 07/09" e "Prisma, 11/09",
// ou seja, é a edição vigente para o ano-modelo 2009/2010 - exatamente o
// veículo-alvo deste manual.
export const sources: Source[] = [
  {
    id: 'src-chevrolet-prisma-2010-owner-manual',
    title: 'Manual do Proprietário Chevrolet Prisma (edição 2010, ficha técnica "Prisma, 07/09")',
    publisher: 'General Motors do Brasil / Chevrolet',
    documentType: 'OWNER_MANUAL',
    publicationYear: 2010,
    url: 'https://www.chevrolet.com.br/content/dam/chevrolet/south-america/brazil/portuguese/index/services/owner-manuals/05-pdf/prisma/manual-prisma-2010.pdf',
    notes: 'Seção 12 (Especificações, p. 12-1 a 12-7) traz a ficha técnica do motor 1.0L MPFI Flexpower separada da do 1.4L. Seção 13 (Serviços e Manutenção, p. 13-1 a 13-16) traz o Quadro de Manutenção Preventiva (revisões a cada 10.000km). Não contém tabela de torques de aperto - esse tipo de dado pertence ao Manual de Reparação/Oficina, que a GM não publica gratuitamente.',
  },
];
