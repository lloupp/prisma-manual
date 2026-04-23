// app/systems/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSystemById, getPartsBySystemId } from '../../../lib/selectors';

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

interface SystemPageProps {
  params: Promise<{ id: string }>;
}

export default async function SystemPage({ params }: SystemPageProps) {
  const { id } = await params;
  const system = await getSystemById(id);

  if (!system) {
    notFound();
  }

  const icon = CATEGORY_ICONS[system.categoryType] || '⚙️';
  const parts = await getPartsBySystemId(id);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
          <ArrowLeft size={16} />
          Manual
        </Link>
        <span>/</span>
        <span className="text-zinc-200">{system.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{system.name}</h1>
            <p className="text-zinc-400 mt-1">{system.description}</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-zinc-500">
          <span className="bg-zinc-800 px-3 py-1 rounded-full">
            {parts.length} peça{parts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Parts List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Peças deste Sistema</h2>
        <div className="grid gap-4">
          {parts.map(part => {
            if (!part) return null;
            return (
              <Link
                key={part.id}
                href={`/parts/${part.id}`}
                className="bg-zinc-900 rounded-lg p-5 border border-zinc-800 hover:border-cyan-500/50 transition group no-underline"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold group-hover:text-cyan-400 transition">
                      {part.name}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">{part.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                      <span>Código: {part.partNumber}</span>
                      <span>Marca: {part.brand}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 font-medium">{part.priceRange}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      {part.position || 'Parte do sistema'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Informações:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-zinc-800 px-2 py-1 rounded text-xs">
                      OEM: {part.oemNumber}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
