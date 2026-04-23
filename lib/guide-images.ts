// lib/guide-images.ts
/**
 * Mapeamento de IDs de guias para suas imagens ilustrativas.
 * As imagens estão em /images/guides/ no diretório public.
 */

const GUIDE_IMAGES: Record<string, string> = {
  // Óleo
  'guide-oil-filter': '/images/guides/oil-change.svg',
  'guide-oil-change': '/images/guides/oil-change.svg',
  'guide-drain-plug': '/images/guides/oil-change.svg',

  // Ar
  'guide-air-filter': '/images/guides/air-filter.svg',

  // Ignição
  'guide-spark-plugs': '/images/guides/spark-plugs.svg',
  'guide-ignition-coils': '/images/guides/spark-plugs.svg',

  // Freios
  'guide-front-brake-pads': '/images/guides/brake-pads.svg',
  'guide-rear-brake-pads': '/images/guides/brake-pads.svg',
  'guide-brake-fluid': '/images/guides/brake-pads.svg',

  // Bateria
  'guide-battery': '/images/guides/battery.svg',

  // Sistema de arrefecimento
  'guide-coolant': '/images/guides/cooling.svg',
  'guide-radiator': '/images/guides/cooling.svg',
  'guide-thermostat': '/images/guides/cooling.svg',
  'guide-cooling-fan': '/images/guides/cooling.svg',
  'guide-fuel-filter': '/images/guides/air-filter.svg',
  'guide-headlight-bulb': '/images/guides/battery.svg',
  'guide-tail-light-bulb': '/images/guides/battery.svg',
  'guide-turn-signal-bulb': '/images/guides/battery.svg',
  'guide-shock-absorbers': '/images/guides/brake-pads.svg',
  'guide-ball-joints': '/images/guides/brake-pads.svg',
};

export function getGuideImageUrl(guideId: string): string | null {
  return GUIDE_IMAGES[guideId] || null;
}

export function getGuideImageForPart(partId: string): string | null {
  const partToGuide: Record<string, string> = {
    'part-oil-filter': 'guide-oil-filter',
    'part-drain-plug': 'guide-drain-plug',
    'part-air-filter': 'guide-air-filter',
    'part-spark-plugs': 'guide-spark-plugs',
    'part-ignition-coils': 'guide-spark-plugs',
    'part-coolant': 'guide-coolant',
    'part-radiator': 'guide-radiator',
    'part-front-brake-pads': 'guide-front-brake-pads',
    'part-rear-brake-pads': 'guide-rear-brake-pads',
    'part-brake-fluid': 'guide-brake-fluid',
    'part-battery': 'guide-battery',
    'part-fuel-filter': 'guide-fuel-filter',
    'part-headlight-bulb': 'guide-headlight-bulb',
    'part-tail-light-bulb': 'guide-tail-light-bulb',
    'part-turn-signal-bulb': 'guide-turn-signal-bulb',
    'part-shock-absorbers': 'guide-shock-absorbers',
    'part-ball-joints': 'guide-ball-joints',
  };

  const guideId = partToGuide[partId];
  return guideId ? GUIDE_IMAGES[guideId] || null : null;
}
