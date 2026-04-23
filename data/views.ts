import { CarView } from '../types';
import { ViewType } from '../types/enums';

export const views: CarView[] = [
  {
    id: 'view-front',
    vehicleId: 'prisma-2009-2010',
    name: 'Vista Frontal',
    viewType: ViewType.FRONT,
    description: 'Vista frontal completa do Chevrolet Prisma Maxx 2010',
    cameraPosition: { x: 0, y: 1, z: 4 },
    cameraTarget: { x: 0, y: 0.5, z: 0 },
    thumbnailUrl: '/views/thumbnails/front.jpg'
  },
  {
    id: 'view-rear',
    vehicleId: 'prisma-2009-2010',
    name: 'Vista Traseira',
    viewType: ViewType.REAR,
    description: 'Vista traseira completa do Chevrolet Prisma Maxx 2010',
    cameraPosition: { x: 0, y: 1, z: -4 },
    cameraTarget: { x: 0, y: 0.5, z: 0 },
    thumbnailUrl: '/views/thumbnails/rear.jpg'
  },
  {
    id: 'view-left',
    vehicleId: 'prisma-2009-2010',
    name: 'Vista Lateral Esquerda',
    viewType: ViewType.LEFT,
    description: 'Vista lateral esquerda do Chevrolet Prisma Maxx 2010',
    cameraPosition: { x: -4, y: 1, z: 0 },
    cameraTarget: { x: 0, y: 0.5, z: 0 },
    thumbnailUrl: '/views/thumbnails/left.jpg'
  },
  {
    id: 'view-right',
    vehicleId: 'prisma-2009-2010',
    name: 'Vista Lateral Direita',
    viewType: ViewType.RIGHT,
    description: 'Vista lateral direita do Chevrolet Prisma Maxx 2010',
    cameraPosition: { x: 4, y: 1, z: 0 },
    cameraTarget: { x: 0, y: 0.5, z: 0 },
    thumbnailUrl: '/views/thumbnails/right.jpg'
  },
  {
    id: 'view-top',
    vehicleId: 'prisma-2009-2010',
    name: 'Vista Superior',
    viewType: ViewType.TOP,
    description: 'Vista superior do Chevrolet Prisma Maxx 2010',
    cameraPosition: { x: 0, y: 5, z: 0 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    thumbnailUrl: '/views/thumbnails/top.jpg'
  },
  {
    id: 'view-interior',
    vehicleId: 'prisma-2009-2010',
    name: 'Interior',
    viewType: ViewType.INTERIOR,
    description: 'Vista do interior do Chevrolet Prisma Maxx 2010',
    cameraPosition: { x: 0, y: 1.2, z: 0 },
    cameraTarget: { x: 0, y: 1, z: 1 },
    thumbnailUrl: '/views/thumbnails/interior.jpg'
  }
];
