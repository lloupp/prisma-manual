import { CarArea } from '../types';
import { AreaType } from '../types/enums';

export const areas: CarArea[] = [
  {
    id: 'area-engine-bay',
    vehicleId: 'prisma-2009-2010',
    name: 'Compartimento do Motor',
    areaType: AreaType.ENGINE_BAY,
    description: 'Área do motor e componentes do compartimento do motor',
    iconName: 'engine',
    systemIds: [
      'sys-engine-oil',
      'sys-engine-air',
      'sys-engine-ignition',
      'sys-cooling',
      'sys-fuel'
    ]
  },
  {
    id: 'area-cabin',
    vehicleId: 'prisma-2009-2010',
    name: 'Cabine',
    areaType: AreaType.CABIN,
    description: 'Interior do veículo incluindo painel e comandos',
    iconName: 'car',
    systemIds: ['sys-wipers']
  },
  {
    id: 'area-trunk',
    vehicleId: 'prisma-2009-2010',
    name: 'Porta-Malas',
    areaType: AreaType.TRUNK,
    description: 'Compartimento traseiro do veículo',
    iconName: 'package',
    systemIds: ['sys-electrical-battery']
  },
  {
    id: 'area-exterior',
    vehicleId: 'prisma-2009-2010',
    name: 'Exterior',
    areaType: AreaType.EXTERIOR,
    description: 'Parte externa do veículo',
    iconName: 'car',
    systemIds: ['sys-electrical-lighting', 'sys-brakes']
  },
  {
    id: 'area-undercarriage',
    vehicleId: 'prisma-2009-2010',
    name: 'Sub chassis',
    areaType: AreaType.UNDERCARRIAGE,
    description: 'Parte inferior do veículo',
    iconName: 'settings',
    systemIds: ['sys-suspension']
  }
];
