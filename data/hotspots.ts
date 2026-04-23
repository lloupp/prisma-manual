// hotspots.ts
// Mapeia áreas do Prisma para views e coordenadas {x, y} de hotspots sobre imagens
// Cada área (como "engine-bay", "cabin", etc) possui views possíveis (ex: "frontal", "esquerda", "traseira", etc)

export type Hotspot = {
  area: string; // Ex: area-engine-bay
  view: string; // Ex: view-front
  x: number;
  y: number;
};

export const hotspots: Hotspot[] = [
  // Engine Bay
  { area: 'area-engine-bay', view: 'view-front', x: 56, y: 21 },
  { area: 'area-engine-bay', view: 'view-left', x: 44, y: 35 },
  { area: 'area-engine-bay', view: 'view-right', x: 64, y: 32 },

  // Cabin
  { area: 'area-cabin', view: 'view-interior', x: 50, y: 70 },
  { area: 'area-cabin', view: 'view-top', x: 51, y: 42 },

  // Trunk
  { area: 'area-trunk', view: 'view-rear', x: 35, y: 52 },

  // Exterior
  { area: 'area-exterior', view: 'view-front', x: 53, y: 15 },
  { area: 'area-exterior', view: 'view-rear', x: 30, y: 18 },
  { area: 'area-exterior', view: 'view-left', x: 24, y: 33 },
  { area: 'area-exterior', view: 'view-right', x: 72, y: 32 },

  // Undercarriage
  { area: 'area-undercarriage', view: 'view-top', x: 43, y: 85 },
  { area: 'area-undercarriage', view: 'view-front', x: 55, y: 92 }
];

export default hotspots;
