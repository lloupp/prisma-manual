// CategoryCard.tsx
import Link from 'next/link';
import { SystemCategory } from '../../types';
import { cn } from '../../lib/utils';

interface CategoryCardProps {
  categoria: SystemCategory;
}

const CATEGORY_ICONS: Record<string, string> = {
  engine: '⚙️',
  cooling: '❄️',
  fuel: '⛽',
  electrical: '⚡',
  brakes: '🛑',
  suspension: '🔧',
  exterior: '🚗',
  interior: '💺',
};

export default function CategoryCard({ categoria }: CategoryCardProps) {
  const icon = CATEGORY_ICONS[categoria.categoryType] || '⚙️';

  return (
    <Link
      href={`/systems/${categoria.id}`}
      className={cn(
        'bg-zinc-900 rounded-lg shadow p-5 flex flex-col gap-3 hover:ring-2 ring-cyan-400/50 cursor-pointer transition',
        'border border-zinc-800 no-underline'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xl font-semibold">{categoria.name}</h3>
      </div>
      <p className="text-zinc-400 text-sm">{categoria.description}</p>
      <span className="mt-auto text-xs text-zinc-500">{categoria.partIds.length} peças</span>
    </Link>
  );
}
