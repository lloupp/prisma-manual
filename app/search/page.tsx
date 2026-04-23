// app/search/page.tsx
import Link from 'next/link';
import { ArrowLeft, Search, Wrench, Cog, FileText } from 'lucide-react';
import { searchAll } from '../../lib/search';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

const TYPE_ICONS = {
  system: <Cog className="text-cyan-400" size={20} />,
  part: <Wrench className="text-amber-400" size={20} />,
  guide: <FileText className="text-green-400" size={20} />,
};

const TYPE_LABELS = {
  system: 'Sistema',
  part: 'Peça',
  guide: 'Guia',
};

const TYPE_COLORS = {
  system: 'bg-cyan-900/30 border-cyan-700/50 hover:border-cyan-500',
  part: 'bg-amber-900/30 border-amber-700/50 hover:border-amber-500',
  guide: 'bg-green-900/30 border-green-700/50 hover:border-green-500',
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q || '';
  const results = await searchAll(query);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Header */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
          <ArrowLeft size={16} />
          Manual
        </Link>
      </nav>

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Search className="text-cyan-400" size={28} />
          <h1 className="text-2xl font-bold">Resultados para "{query}"</h1>
        </div>
        <p className="text-zinc-400">
          {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-lg mb-4">
            Nenhum resultado encontrado para "{query}"
          </p>
          <p className="text-zinc-500 text-sm">
            Tente buscar por: nome da peça, sintoma, código ou sistema
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(result => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.url}
              className={`block bg-zinc-900 rounded-lg p-5 border ${TYPE_COLORS[result.type]} transition no-underline`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {TYPE_ICONS[result.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-zinc-100">
                      {result.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      result.type === 'system' ? 'bg-cyan-900/50 text-cyan-300' :
                      result.type === 'part' ? 'bg-amber-900/50 text-amber-300' :
                      'bg-green-900/50 text-green-300'
                    }`}>
                      {TYPE_LABELS[result.type]}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm truncate">{result.description}</p>
                  {(result.systemName || result.partName) && (
                    <p className="text-zinc-500 text-xs mt-1">
                      {result.partName && `${result.partName} › `}
                      {result.systemName}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
