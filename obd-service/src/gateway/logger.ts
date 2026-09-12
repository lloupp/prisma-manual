/**
 * Log estruturado simples. Nunca registra segredos (não há segredos no
 * fluxo OBD - nenhuma senha, token ou chave passa por aqui - mas o formato
 * fica pronto para o dia em que algo sensível existir, como uma API key de
 * IA na integração do agente).
 */
type Level = 'info' | 'warn' | 'error';

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
