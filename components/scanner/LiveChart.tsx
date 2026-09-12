'use client';

export interface ChartSample {
  t: number; // timestamp em ms
  value: number;
}

interface LiveChartProps {
  label: string;
  unit: string;
  samples: ChartSample[];
  windowMs: number;
  color?: string;
}

const WIDTH = 600;
const HEIGHT = 140;
const PADDING = 24;

export default function LiveChart({ label, unit, samples, windowMs, color = '#22d3ee' }: LiveChartProps) {
  // Se não há amostras, `now` é irrelevante: o filtro abaixo produzirá uma
  // lista vazia de qualquer forma e cairemos no retorno antecipado. Evitamos
  // Date.now() aqui porque chamar uma função impura durante a renderização
  // quebra a pureza esperada do componente.
  const now = samples.length > 0 ? samples[samples.length - 1].t : 0;
  const windowStart = now - windowMs;
  const visible = samples.filter(s => s.t >= windowStart);

  if (visible.length < 2) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <p className="text-sm text-zinc-400 mb-2">{label}</p>
        <p className="text-xs text-zinc-600">Aguardando amostras suficientes...</p>
      </div>
    );
  }

  const values = visible.map(s => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = visible.map(s => {
    const x = PADDING + ((s.t - windowStart) / windowMs) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((s.value - min) / range) * (HEIGHT - PADDING * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = visible[visible.length - 1].value;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="text-sm font-mono text-cyan-400">{last.toFixed(1)} {unit}</p>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label={`Gráfico de ${label} nos últimos ${Math.round(windowMs / 1000)}s`}>
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#3f3f46" strokeWidth={1} />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#3f3f46" strokeWidth={1} />
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={2} />
        <text x={PADDING} y={PADDING - 6} fontSize={10} fill="#71717a">{max.toFixed(1)}</text>
        <text x={PADDING} y={HEIGHT - PADDING + 12} fontSize={10} fill="#71717a">{min.toFixed(1)}</text>
      </svg>
    </div>
  );
}
