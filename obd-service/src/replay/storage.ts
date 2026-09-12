// obd-service/src/replay/storage.ts
//
// Persistência simples de Recording em disco (JSON). Sem banco de dados -
// uma sessão gravada é só um arquivo, fácil de inspecionar, versionar ou
// compartilhar manualmente.

import { writeFileSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Recording } from './recording';

export function saveRecordingToFile(recording: Recording, filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(recording, null, 2), 'utf-8');
}

export function loadRecordingFromFile(filePath: string): Recording {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Recording;
}

export interface RecordingFileDescriptor {
  fileName: string;
  id: string;
  label: string;
  recordedAt: string;
  frameCount: number;
}

/** Lista os arquivos .json de gravação num diretório, com metadados
 * suficientes para um seletor de UI - sem carregar os frames inteiros. */
export function listRecordingFiles(dir: string): RecordingFileDescriptor[] {
  let entries: string[];
  try {
    entries = readdirSync(dir).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
  return entries.map(fileName => {
    const recording = loadRecordingFromFile(join(dir, fileName));
    return {
      fileName,
      id: recording.id,
      label: recording.label,
      recordedAt: recording.recordedAt,
      frameCount: recording.frames.length,
    };
  });
}
