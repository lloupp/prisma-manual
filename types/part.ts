import { Confidence } from './enums';

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
  /** Confiança do código de peça/marca informados - ver AGENTS.md. */
  confidence: Confidence;
}
