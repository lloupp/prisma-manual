export interface Part {
  id: string;
  systemId: string;
  name: string;
  partNumber: string;
  oemNumber: string;
  brand: string;
  position: string;
  description: string;
  symptoms: string[];
  guideIds: string[];
  replacementInterval: string;
  priceRange: string;
}
