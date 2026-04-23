import { SystemCategory } from '../types';
import { SystemCategoryType } from '../types/enums';

export const systems: SystemCategory[] = [
  {
    id: 'sys-engine-oil',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Óleo do Motor',
    categoryType: SystemCategoryType.ENGINE,
    description: 'Sistema de lubrificação do motor incluindo filtro de óleo',
    partIds: ['part-oil-filter', 'part-drain-plug']
  },
  {
    id: 'sys-engine-air',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Ar do Motor',
    categoryType: SystemCategoryType.ENGINE,
    description: 'Sistema de admissão de ar do motor',
    partIds: ['part-air-filter']
  },
  {
    id: 'sys-engine-ignition',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Ignição',
    categoryType: SystemCategoryType.ENGINE,
    description: 'Sistema de ignição incluindo velas e bobinas',
    partIds: ['part-spark-plugs', 'part-ignition-coils']
  },
  {
    id: 'sys-cooling',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Arrefecimento',
    categoryType: SystemCategoryType.COOLING,
    description: 'Sistema de arrefecimento do motor',
    partIds: ['part-coolant', 'part-radiator', 'part-thermostat', 'part-cooling-fan']
  },
  {
    id: 'sys-fuel',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Combustível',
    categoryType: SystemCategoryType.FUEL,
    description: 'Sistema de alimentação de combustível',
    partIds: ['part-fuel-filter']
  },
  {
    id: 'sys-wipers',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Palhetas',
    categoryType: SystemCategoryType.EXTERIOR,
    description: 'Sistema de limpiadores e palhetas',
    partIds: ['part-wiper-blades', 'part-wiper-arms']
  },
  {
    id: 'sys-electrical-battery',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema Elétrico - Bateria',
    categoryType: SystemCategoryType.ELECTRICAL,
    description: 'Sistema elétrico incluindo bateria e caixa de fusíveis',
    partIds: ['part-battery', 'part-fuse-box', 'part-fuses']
  },
  {
    id: 'sys-electrical-lighting',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Iluminação',
    categoryType: SystemCategoryType.ELECTRICAL,
    description: 'Sistema de iluminação externa',
    partIds: ['part-headlight-bulb', 'part-tail-light-bulb', 'part-turn-signal-bulb']
  },
  {
    id: 'sys-brakes',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Freios',
    categoryType: SystemCategoryType.BRAKES,
    description: 'Sistema de freios incluindo pastilhas e fluido',
    partIds: ['part-front-brake-pads', 'part-rear-brake-pads', 'part-brake-fluid']
  },
  {
    id: 'sys-suspension',
    vehicleId: 'prisma-2009-2010',
    name: 'Sistema de Suspensão',
    categoryType: SystemCategoryType.SUSPENSION,
    description: 'Sistema de suspensão do veículo',
    partIds: ['part-shock-absorbers', 'part-ball-joints']
  }
];
