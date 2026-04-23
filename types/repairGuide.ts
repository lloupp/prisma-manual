import { DifficultyLevel, GuideStepStatus } from './enums';

export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl: string;
  status: GuideStepStatus;
  tips: string[];
  warnings: string[];
}

export interface RepairGuide {
  id: string;
  partId: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedTime: string;
  estimatedTimeMinutes: number;
  tools: string[];
  materials: string[];
  steps: GuideStep[];
  precautions: string[];
  commonIssues: string[];
  professionalHelp: string;
  /** URL da imagem principal do guia (para preview) */
  imageUrl?: string;
}
