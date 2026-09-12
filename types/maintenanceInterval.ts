import { Confidence } from './enums';

export type MaintenanceCategory =
  | 'MOTOR'
  | 'ARREFECIMENTO'
  | 'FREIOS'
  | 'SUSPENSAO_DIRECAO'
  | 'CARROCERIA'
  | 'ELETRICA';

export interface MaintenanceInterval {
  id: string;
  category: MaintenanceCategory;
  service: string;
  intervalKm?: number;
  intervalMonths?: number;
  severeConditionKm?: number;
  severeConditionMonths?: number;
  notes?: string;
  applicability: string;
  confidence: Confidence;
}
