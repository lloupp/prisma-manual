// utils.ts
/** Utilitário para classnames. Usa concatenação simples para este projeto. */
export function cn(...args: (string | undefined | false | null)[]) {
  return args.filter(Boolean).join(' ');
}

/** Formata minutos em "X min" ou "Xh Ym" */
export function formatTime(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/** Formata valor em reais no padrão brasileiro */
export function formatCurrency(valor: number) {
  return valor !== undefined
    ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';
}
