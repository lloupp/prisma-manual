import { MaintenanceInterval } from '../types';
import { Confidence } from '../types/enums';

// "Quadro de Manutenção Preventiva" (revisões a cada 10.000km ou 1 ano) e
// "Verificações Periódicas" - Manual do Proprietário Chevrolet Prisma,
// Seção 13, p. 13-13 a 13-16.
const APPLICABILITY = 'Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010, câmbio manual 5 marchas';
const OFFICIAL = Confidence.OFFICIAL;

export const maintenanceIntervals: MaintenanceInterval[] = [
  { id: 'mi-engine-oil', category: 'MOTOR', service: 'Óleo do motor: substituir', intervalKm: 10000, intervalMonths: 12, severeConditionKm: 5000, severeConditionMonths: 6, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-oil-filter', category: 'MOTOR', service: 'Filtro de óleo: trocar o elemento', intervalKm: 20000, notes: 'Trocar obrigatoriamente na primeira troca de óleo e, depois, a cada duas trocas de óleo do motor.', applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-spark-plugs', category: 'MOTOR', service: 'Velas de ignição (motor 8V): substituir', intervalKm: 30000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-timing-belt-check', category: 'MOTOR', service: 'Correia dentada da distribuição: verificar estado e tensionador automático', intervalKm: 20000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-timing-belt-replace', category: 'MOTOR', service: 'Correia dentada da distribuição: substituir', intervalKm: 50000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-accessory-belts-check', category: 'MOTOR', service: 'Correias de agregados (acessórios): verificar estado', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-accessory-belts-replace', category: 'MOTOR', service: 'Correias de agregados (acessórios): substituir', intervalKm: 50000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-air-filter-check', category: 'MOTOR', service: 'Filtro de ar: verificar estado e limpar se necessário', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-air-filter-replace', category: 'MOTOR', service: 'Filtro de ar: substituir o elemento', intervalKm: 30000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-fuel-filter-external', category: 'MOTOR', service: 'Filtro de combustível externo (sistema Flexpower): substituir', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-fuel-prefilter', category: 'MOTOR', service: 'Pré-filtro de combustível (pescador da bomba, interno ao tanque): substituir', intervalKm: 80000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-transmission-oil-check', category: 'MOTOR', service: 'Transmissão manual: verificar nível de óleo e completar se necessário', intervalKm: 20000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-clutch-pedal', category: 'MOTOR', service: 'Pedal da embreagem: verificar curso livre', intervalKm: 30000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-coolant-replace', category: 'ARREFECIMENTO', service: 'Sistema de arrefecimento: substituir o líquido', intervalKm: 150000, intervalMonths: 60, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-brake-pads-check', category: 'FREIOS', service: 'Pastilhas e disco de freio: verificar desgaste', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-brake-shoes-check', category: 'FREIOS', service: 'Lonas e tambores: verificar desgaste', intervalKm: 30000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-brake-hoses-check', category: 'FREIOS', service: 'Tubulações e mangueiras de freio: verificar vazamento', intervalKm: 20000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-brake-fluid-replace', category: 'FREIOS', service: 'Fluido de freio: substituir', intervalKm: 30000, intervalMonths: 24, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-power-steering-check', category: 'SUSPENSAO_DIRECAO', service: 'Óleo do reservatório da direção hidráulica: verificar nível', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-shocks-check', category: 'SUSPENSAO_DIRECAO', service: 'Amortecedores: verificar fixação e vazamentos', intervalKm: 10000, notes: 'O manual do proprietário prescreve apenas inspeção periódica, sem um intervalo fixo de substituição.', applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-steering-torque-check', category: 'SUSPENSAO_DIRECAO', service: 'Sistema de direção: verificar folga e torque dos parafusos', intervalKm: 20000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-tires-check', category: 'SUSPENSAO_DIRECAO', service: 'Pneus: verificar pressão, desgaste, avarias e rodízio; verificar torque das porcas das rodas', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-ac-filter', category: 'CARROCERIA', service: 'Filtro de limpeza do ar-condicionado/ventilação: substituir', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-seatbelts-check', category: 'CARROCERIA', service: 'Cintos de segurança: verificar cadarços, fivelas e parafusos', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
  { id: 'mi-fault-codes-check', category: 'ELETRICA', service: 'Sistema elétrico: verificar códigos de falha com equipamento de diagnóstico (TECH 2)', intervalKm: 10000, applicability: APPLICABILITY, confidence: OFFICIAL },
];
