// DifficultyBadge.tsx
interface DifficultyBadgeProps {
  level: 'easy' | 'medium' | 'hard';
}

// Cores: fácil(#22c55e), médio(#eab308), difícil(#ef4444)
const labels = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};
const colors = {
  easy: 'bg-green-600 text-white',
  medium: 'bg-yellow-500 text-yellow-950',
  hard: 'bg-red-600 text-white',
};

export default function DifficultyBadge({ level }: DifficultyBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[level]}`}>{labels[level]}</span>
  );
}
