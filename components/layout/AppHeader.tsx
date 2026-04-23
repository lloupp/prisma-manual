// AppHeader.tsx
import { Car } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
      <Car size={28} className="text-cyan-500" />
      <span className="text-lg font-bold tracking-tight">Manual Prisma</span>
    </header>
  );
}
