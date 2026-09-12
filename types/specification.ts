import { Confidence } from './enums';

export type SpecificationSystem =
  | 'MOTOR'
  | 'SISTEMA_ELETRICO'
  | 'TRANSMISSAO'
  | 'FREIOS'
  | 'PNEUS'
  | 'DIRECAO'
  | 'CARROCERIA';

export interface Specification {
  id: string;
  system: SpecificationSystem;
  label: string;
  value: string;
  unit?: string;
  applicability: string;
  confidence: Confidence;
  notes?: string;
}
