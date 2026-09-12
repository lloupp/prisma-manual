export enum ViewType {
  FRONT = 'front',
  REAR = 'rear',
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  INTERIOR = 'interior'
}

export enum AreaType {
  ENGINE_BAY = 'engine_bay',
  CABIN = 'cabin',
  TRUNK = 'trunk',
  EXTERIOR = 'exterior',
  UNDERCARRIAGE = 'undercarriage'
}

export enum SystemCategoryType {
  ENGINE = 'engine',
  TRANSMISSION = 'transmission',
  BRAKES = 'brakes',
  SUSPENSION = 'suspension',
  ELECTRICAL = 'electrical',
  COOLING = 'cooling',
  FUEL = 'fuel',
  EXHAUST = 'exhaust',
  INTERIOR = 'interior',
  EXTERIOR = 'exterior'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum GuideStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Nível de confiança de uma especificação/procedimento - ver AGENTS.md.
// UNVERIFIED nunca deve ser apresentado ao usuário como um fato confirmado.
export enum Confidence {
  OFFICIAL = 'OFFICIAL',
  OEM = 'OEM',
  CROSS_VERIFIED = 'CROSS_VERIFIED',
  UNVERIFIED = 'UNVERIFIED'
}
