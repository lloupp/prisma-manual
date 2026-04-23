// app/guides/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Wrench, AlertTriangle } from 'lucide-react';
import { getGuideById, getPartById, getSystemById } from '../../../lib/selectors';
import { formatTime } from '../../../lib/utils';
import { getGuideImageUrl } from '../../../lib/guide-images';

interface GuidePageProps {
  params: Promise<{ id: string }>;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { id } = await params;
  const guide = await getGuideById(id);

  if (!guide) {
    notFound();
  }

  const part = await getPartById(guide.partId);
  const system = part ? await getSystemById(part.systemId) : null;

  const difficultyLabels = {
    easy: { label: 'Fácil', color: 'text-green-400', bg: 'bg-green-900/30' },
    medium: { label: 'Médio', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
    hard: { label: 'Difícil', color: 'text-red-400', bg: 'bg-red-900/30' },
  };
  const difficulty = difficultyLabels[guide.difficulty];

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
        {part && (
          <>
            <Link href={`/parts/${part.id}`} className="hover:text-cyan-400 transition">
              {part.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-200">Guia</span>
      </nav>

      {/* Header */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3">{guide.title}</h1>
            <p className="text-zinc-400 mb-6">{guide.description}</p>

            <div className="flex flex-wrap gap-3">
              <span className={`${difficulty.bg} ${difficulty.color} px-3 py-1 rounded-full text-sm font-medium`}>
                {difficulty.label}
              </span>
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Clock size={14} />
                {formatTime(guide.estimatedTimeMinutes)}
              </span>
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm">
                {guide.steps.length} passos
              </span>
            </div>
          </div>

          {/* Guide Image */}
          {(() => {
            const imageUrl = getGuideImageUrl(guide.id);
            return imageUrl ? (
              <div className="flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={guide.title}
                  className="w-48 h-36 object-contain rounded-lg bg-zinc-800 border border-zinc-700"
                />
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Tools & Materials */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wrench className="text-cyan-400" size={20} />
            Ferramentas
          </h2>
          <ul className="space-y-2">
            {guide.tools.map(tool => (
              <li key={tool} className="flex items-center gap-2 text-zinc-300">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                {tool}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🧰</span>
            Materiais
          </h2>
          <ul className="space-y-2">
            {guide.materials.map(material => (
              <li key={material} className="flex items-center gap-2 text-zinc-300">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                {material}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Precautions */}
      {guide.precautions.length > 0 && (
        <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-900/30">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
            <AlertTriangle size={20} />
            Precauções
          </h2>
          <ul className="space-y-2">
            {guide.precautions.map(precaution => (
              <li key={precaution} className="flex items-start gap-2 text-zinc-300">
                <span className="w-2 h-2 bg-amber-400 rounded-full mt-2"></span>
                {precaution}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Passo a Passo</h2>
        <div className="space-y-4">
          {guide.steps.map(step => (
            <div
              key={step.stepNumber}
              className="bg-zinc-900 rounded-xl p-5 border border-zinc-800"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center font-bold text-lg">
                  {step.stepNumber}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-zinc-300 mb-4">{step.description}</p>

                  {step.warnings.length > 0 && (
                    <div className="bg-red-900/20 rounded-lg p-3 border border-red-900/30 mb-3">
                      <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Avisos
                      </p>
                      <ul className="space-y-1">
                        {step.warnings.map(warning => (
                          <li key={warning} className="text-sm text-red-300">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.tips.length > 0 && (
                    <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-900/30">
                      <p className="text-xs text-cyan-400 font-semibold mb-2 flex items-center gap-1">
                        💡 Dicas
                      </p>
                      <ul className="space-y-1">
                        {step.tips.map(tip => (
                          <li key={tip} className="text-sm text-cyan-300">
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Common Issues */}
      {guide.commonIssues.length > 0 && (
        <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700">
          <h2 className="text-lg font-semibold mb-4">Problemas Comuns</h2>
          <ul className="space-y-2">
            {guide.commonIssues.map(issue => (
              <li key={issue} className="flex items-start gap-2 text-zinc-300">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2"></span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Professional Help */}
      {guide.professionalHelp && (
        <div className="bg-cyan-900/20 rounded-xl p-5 border border-cyan-900/30">
          <h2 className="text-lg font-semibold mb-2 text-cyan-400">Quando Procurar Ajuda Profissional</h2>
          <p className="text-zinc-300">{guide.professionalHelp}</p>
        </div>
      )}
    </div>
  );
}