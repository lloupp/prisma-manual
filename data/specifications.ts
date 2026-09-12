import { Specification } from '../types';
import { Confidence } from '../types/enums';

// Todas as linhas abaixo vêm do Manual do Proprietário Chevrolet Prisma,
// Seção 12 "Especificações", coluna "1.0L MPFI Flexpower" (não a coluna
// 1.4L). Ver data/sources.ts e data/source-references.ts.
const APPLICABILITY = 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010, câmbio manual 5 marchas';

export const specifications: Specification[] = [
  // MOTOR — p. 12-2
  { id: 'spec-engine-type', system: 'MOTOR', label: 'Tipo', value: 'Transversal, dianteiro, 4 cilindros em linha, 8V', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-displacement', system: 'MOTOR', label: 'Cilindrada', value: '999', unit: 'cm³', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-bore', system: 'MOTOR', label: 'Diâmetro interno do cilindro', value: '71,1', unit: 'mm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-stroke', system: 'MOTOR', label: 'Curso do êmbolo', value: '62,9', unit: 'mm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-compression', system: 'MOTOR', label: 'Razão de compressão', value: '12,6:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-ignition-order', system: 'MOTOR', label: 'Ordem de ignição', value: '1-3-4-2', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-idle', system: 'MOTOR', label: 'Rotação de marcha lenta', value: '800 a 1.000', unit: 'rpm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-engine-power-gas', system: 'MOTOR', label: 'Potência máxima (gasolina)', value: '77 CV (56,7 kW) a 6.400 rpm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'NBR ISO 1585' },
  { id: 'spec-engine-power-alc', system: 'MOTOR', label: 'Potência máxima (álcool)', value: '78 CV (57,4 kW) a 6.400 rpm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'NBR ISO 1585' },
  { id: 'spec-engine-torque-gas', system: 'MOTOR', label: 'Torque máximo (gasolina)', value: '93 N.m (9,5 kgf.m) a 5.200 rpm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'NBR ISO 1585' },
  { id: 'spec-engine-torque-alc', system: 'MOTOR', label: 'Torque máximo (álcool)', value: '95 N.m (9,7 kgf.m) a 5.200 rpm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'NBR ISO 1585' },
  { id: 'spec-fuel-tank', system: 'MOTOR', label: 'Capacidade do tanque de combustível', value: '54 (5,0 de reserva)', unit: 'litros', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },

  // SISTEMA ELÉTRICO — p. 12-2/12-3
  { id: 'spec-battery', system: 'SISTEMA_ELETRICO', label: 'Bateria (especificação de fábrica)', value: '12V, 42', unit: 'Ah', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'Baterias de reposição 50Ah são comumente vendidas como compatíveis pelo mercado de reposição, mas essa recomendação específica de upgrade não é confirmada por esta fonte.' },
  { id: 'spec-alternator', system: 'SISTEMA_ELETRICO', label: 'Alternador', value: '60A sem A/C; 90A com A/C e/ou direção hidráulica', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-spark-plug-model', system: 'SISTEMA_ELETRICO', label: 'Vela de ignição', value: 'NGK BR8ES', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-spark-plug-gap', system: 'SISTEMA_ELETRICO', label: 'Folga dos eletrodos da vela', value: '0,7 a 0,9', unit: 'mm', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-ignition-system', system: 'SISTEMA_ELETRICO', label: 'Sistema de ignição', value: 'Ignição direta (sem distribuidor)', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },

  // TRANSMISSÃO — p. 12-3 (5 marchas)
  { id: 'spec-gear-1', system: 'TRANSMISSAO', label: '1ª marcha (redução)', value: '4,27:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-gear-2', system: 'TRANSMISSAO', label: '2ª marcha (redução)', value: '2,35:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-gear-3', system: 'TRANSMISSAO', label: '3ª marcha (redução)', value: '1,48:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-gear-4', system: 'TRANSMISSAO', label: '4ª marcha (redução)', value: '1,05:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-gear-5', system: 'TRANSMISSAO', label: '5ª marcha (redução)', value: '0,80:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-gear-r', system: 'TRANSMISSAO', label: 'Marcha à ré (redução)', value: '3,31:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-differential', system: 'TRANSMISSAO', label: 'Diferencial', value: '4,87:1', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },

  // FREIOS — p. 12-5
  { id: 'spec-brakes-front', system: 'FREIOS', label: 'Freio dianteiro', value: 'A disco ventilado', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-brakes-rear', system: 'FREIOS', label: 'Freio traseiro', value: 'A tambor', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-brakes-abs', system: 'FREIOS', label: 'ABS', value: 'Não mencionado no Manual do Proprietário desta edição', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'O termo "ABS" não aparece em nenhuma página do manual consultado, o que indica que a versão Maxx 1.0 2009/2010 não trazia esse item nesta configuração/ano - trate como não equipado até confirmação em contrário.' },
  { id: 'spec-parking-brake', system: 'FREIOS', label: 'Freio de estacionamento', value: 'Mecânico, atuante nas rodas traseiras', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },

  // PNEUS E RODAS — p. 12-6
  { id: 'spec-tire-size', system: 'PNEUS', label: 'Medida do pneu (padrão)', value: '175/65 R14 - 82T, roda 5 1/2J x 14"', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-tire-pressure-front-normal', system: 'PNEUS', label: 'Pressão dianteira (até 3 pessoas)', value: '27 (1,9)', unit: 'lbf/pol² (kgf/cm²)', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-tire-pressure-rear-normal', system: 'PNEUS', label: 'Pressão traseira (até 3 pessoas)', value: '27 (1,9)', unit: 'lbf/pol² (kgf/cm²)', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-tire-pressure-front-loaded', system: 'PNEUS', label: 'Pressão dianteira (carga plena)', value: '30 (2,1)', unit: 'lbf/pol² (kgf/cm²)', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL },
  { id: 'spec-tire-pressure-rear-loaded', system: 'PNEUS', label: 'Pressão traseira (carga plena)', value: '36 (2,5)', unit: 'lbf/pol² (kgf/cm²)', applicability: APPLICABILITY, confidence: Confidence.OFFICIAL, notes: 'Calibragem a frio.' },
];
