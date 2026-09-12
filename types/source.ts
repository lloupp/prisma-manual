import { Confidence } from './enums';

export type DocumentType =
  | 'OWNER_MANUAL'
  | 'WORKSHOP_MANUAL'
  | 'OEM_CATALOG'
  | 'TECHNICAL_BULLETIN'
  | 'WIRING_DIAGRAM'
  | 'OTHER';

export interface Source {
  id: string;
  title: string;
  publisher: string;
  documentType: DocumentType;
  publicationYear?: number;
  url?: string;
  file?: string;
  notes?: string;
}

export type SubjectType =
  | 'PART'
  | 'GUIDE'
  | 'SPECIFICATION'
  | 'FLUID_SPECIFICATION'
  | 'MAINTENANCE_INTERVAL'
  | 'TORQUE_SPECIFICATION';

export interface SourceReference {
  id: string;
  sourceId: string;
  subjectType: SubjectType;
  subjectId: string;
  page?: string;
  section?: string;
  confidence: Confidence;
  notes?: string;
}
