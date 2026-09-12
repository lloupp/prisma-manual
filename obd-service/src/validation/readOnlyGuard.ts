/**
 * Segunda camada de defesa do modo somente-leitura. A camada primária é o
 * TypeScript union `OBDRequest` (não existe uma variante de escrita para o
 * compilador aceitar). Esta função é a verificação em runtime - útil porque
 * dados vindos de fora do processo (ex: um payload HTTP malformado antes de
 * ser validado/tipado) não passam pelo checador de tipos do TypeScript.
 *
 * Qualquer coisa que não bata exatamente com o formato esperado de um dos
 * `OBDRequest` permitidos é rejeitada. Não existe "modo permissivo".
 */
import { OBDRequest } from '../transport/OBDTransport';

const ALLOWED_KINDS = new Set(['READ_PID', 'READ_SUPPORTED_PIDS', 'READ_DTC', 'READ_FREEZE_FRAME', 'READ_VOLTAGE', 'READ_PROTOCOL']);

const HEX_BYTE = /^[0-9A-Fa-f]{2}$/;

export class ReadOnlyViolationError extends Error {
  constructor(reason: string) {
    super(`Bloqueado pelo modo somente-leitura: ${reason}`);
    this.name = 'ReadOnlyViolationError';
  }
}

export function assertReadOnly(request: unknown): OBDRequest {
  if (typeof request !== 'object' || request === null || !('kind' in request)) {
    throw new ReadOnlyViolationError('requisição sem "kind" reconhecido');
  }
  const kind = (request as { kind: unknown }).kind;
  if (typeof kind !== 'string' || !ALLOWED_KINDS.has(kind)) {
    throw new ReadOnlyViolationError(`kind "${String(kind)}" não está no allowlist de leitura`);
  }

  const req = request as Record<string, unknown>;

  switch (kind) {
    case 'READ_PID': {
      if (req.mode !== '01' && req.mode !== '02') {
        throw new ReadOnlyViolationError('READ_PID só permite modo 01 (dados atuais) ou 02 (freeze frame)');
      }
      if (typeof req.pid !== 'string' || !HEX_BYTE.test(req.pid)) {
        throw new ReadOnlyViolationError('PID inválido');
      }
      return req as unknown as OBDRequest;
    }
    case 'READ_SUPPORTED_PIDS': {
      if (!['00', '20', '40', '60'].includes(req.bank as string)) {
        throw new ReadOnlyViolationError('bank de PIDs suportados inválido');
      }
      return req as unknown as OBDRequest;
    }
    case 'READ_DTC': {
      if (req.mode !== '03' && req.mode !== '07') {
        throw new ReadOnlyViolationError('READ_DTC só permite modo 03 (armazenados) ou 07 (pendentes) - modo 04 (limpar DTC) nunca é permitido');
      }
      return req as unknown as OBDRequest;
    }
    case 'READ_FREEZE_FRAME':
    case 'READ_VOLTAGE':
    case 'READ_PROTOCOL':
      return req as unknown as OBDRequest;
    default:
      throw new ReadOnlyViolationError('kind desconhecido');
  }
}
