import { Confidence } from './enums';

export type TorqueSystem = 'MOTOR' | 'SUSPENSAO' | 'FREIOS' | 'TRANSMISSAO' | 'DIRECAO' | 'RODAS';

export interface TorqueSpecification {
  id: string;
  system: TorqueSystem;
  component: string;
  fastener: string;
  valueNm?: number;
  valueKgfm?: number;
  condition?: string;
  applicability: string;
  confidence: Confidence;
  notes?: string;
}
