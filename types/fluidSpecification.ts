import { Confidence } from './enums';

export type FluidSystem =
  | 'MOTOR'
  | 'TRANSMISSAO_MANUAL'
  | 'FREIOS'
  | 'ARREFECIMENTO'
  | 'DIRECAO_HIDRAULICA'
  | 'AR_CONDICIONADO'
  | 'LAVADOR_PARABRISA';

export interface FluidSpecification {
  id: string;
  system: FluidSystem;
  fluidType: string;
  specGrade?: string;
  capacity?: string;
  checkInterval?: string;
  changeInterval?: string;
  applicability: string;
  confidence: Confidence;
  notes?: string;
}
