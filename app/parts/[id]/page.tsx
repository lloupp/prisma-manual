// app/parts/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Wrench, Clock, AlertTriangle } from 'lucide-react';
import { getPartById, getSystemById, getGuidesByPartId } from '../../../lib/selectors';
import { getGuideImageUrl } from '../../../lib/guide-images';

interface PartPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartPage({ params }: PartPageProps) {
  const { id } = await params;
  const part = await getPartById(id);

  if (!part) {
    notFound();
  }

  const system = await getSystemById(part.systemId);
  const guides = await getGuidesByPartId(id);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
          <ArrowLeft size={16} />
          Manual
        </Link>
        <span>/</span>
        {system && (
          <>
            <Link href={`/systems/${system.id}`} className="hover:text-cyan-400 transition">
              {system.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-200">{part.name}</span>
      </nav>

      {/* Part Header */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h1 className="text-3xl font-bold mb-4">{part.name}</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Código</p>
            <p className="font-mono text-cyan-400">{part.partNumber}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">OEM</p>
            <p className="font-mono text-sm">{part.oemNumber}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Marca</p>
            <p className="font-medium">{part.brand}</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Preço</p>
            <p className="text-cyan-400 font-medium">{part.priceRange}</p>
          </div>
        </div>

        <p className="text-zinc-300">{part.description}</p>

        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <span>Posição:</span>
          <span className="text-zinc-300">{part.position}</span>
        </div>
      </div>

      {/* Symptoms */}
      {part.symptoms.length > 0 && (
        <section className="bg-red-900/20 rounded-xl p-6 border border-red-900/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" size={24} />
            <h2 className="text-xl font-semibold">Sintomas de Problema</h2>
          </div>
          <ul className="space-y-2">
            {part.symptoms.map(symptom => (
              <li key={symptom} className="flex items-center gap-2 text-zinc-300">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                {symptom}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Replacement Info */}
      <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 flex items-center gap-3">
        <Clock className="text-cyan-400" size={20} />
        <div>
          <p className="text-xs text-zinc-500">Intervalo de substituição</p>
          <p className="text-zinc-200">{part.replacementInterval}</p>
        </div>
      </div>

      {/* Guides */}
      {guides.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Guias de Reparo</h2>
          <div className="grid gap-4">
            {guides.map(guide => {
              if (!guide) return null;
              const imageUrl = getGuideImageUrl(guide.id);
              return (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.id}`}
                  className="bg-zinc-900 rounded-lg p-5 border border-zinc-800 hover:border-cyan-500/50 transition group no-underline"
                >
                  <div className="flex items-start gap-4">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={guide.title}
                        className="w-20 h-16 object-contain rounded bg-zinc-800 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold group-hover:text-cyan-400 transition">
                        {guide.title}
                      </h3>
                      <p className="text-zinc-400 text-sm mt-1">{guide.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        guide.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                        guide.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-red-900/50 text-red-300'
                      }`}>
                        {guide.difficulty === 'easy' ? 'Fácil' : guide.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock size={12} />
                        {guide.estimatedTime}
                      </span>
                    </div>
                  </div>

                  {guide.tools.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                        <Wrench size={12} />
                        Ferramentas necessárias:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {guide.tools.slice(0, 4).map(tool => (
                          <span key={tool} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                            {tool}
                          </span>
                        ))}
                        {guide.tools.length > 4 && (
                          <span className="text-xs text-zinc-500">+{guide.tools.length - 4} mais</span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}