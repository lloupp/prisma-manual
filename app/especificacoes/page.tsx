import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Gauge, Droplets, CalendarClock, Wrench } from 'lucide-react';
import {
  getSpecifications,
  getFluidSpecifications,
  getMaintenanceIntervals,
  getTorqueSpecifications,
  getSourceReferencesByType,
} from '../../lib/selectors';
import ConfidenceBadge from '../../components/badges/ConfidenceBadge';
import SourceCitation from '../../components/badges/SourceCitation';

export const metadata: Metadata = {
  title: 'Especificações Técnicas',
  description: 'Especificações oficiais, fluidos, plano de manutenção preventiva e torques do Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010, com fonte rastreável para cada dado.',
};

const SYSTEM_LABELS: Record<string, string> = {
  MOTOR: 'Motor',
  SISTEMA_ELETRICO: 'Sistema Elétrico',
  TRANSMISSAO: 'Transmissão',
  FREIOS: 'Freios',
  PNEUS: 'Pneus e Rodas',
  DIRECAO: 'Direção',
  CARROCERIA: 'Carroceria',
  TRANSMISSAO_MANUAL: 'Transmissão Manual',
  ARREFECIMENTO: 'Arrefecimento',
  DIRECAO_HIDRAULICA: 'Direção Hidráulica',
  AR_CONDICIONADO: 'Ar-condicionado',
  LAVADOR_PARABRISA: 'Lavador de Para-brisa',
  SUSPENSAO_DIRECAO: 'Suspensão e Direção',
  ELETRICA: 'Elétrica',
  SUSPENSAO: 'Suspensão',
};

function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function formatIntervalKm(km?: number | null) {
  if (!km) return null;
  return `${km.toLocaleString('pt-BR')}km`;
}

export default async function EspecificacoesPage() {
  const [specs, fluids, intervals, torques] = await Promise.all([
    getSpecifications(),
    getFluidSpecifications(),
    getMaintenanceIntervals(),
    getTorqueSpecifications(),
  ]);

  const [specRefs, fluidRefs, intervalRefs] = await Promise.all([
    getSourceReferencesByType('SPECIFICATION'),
    getSourceReferencesByType('FLUID_SPECIFICATION'),
    getSourceReferencesByType('MAINTENANCE_INTERVAL'),
  ]);

  const specsBySystem = groupBy(specs, s => s.system);
  const intervalsByCategory = groupBy(intervals, m => m.category);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
          <ArrowLeft size={16} />
          Manual
        </Link>
        <span>/</span>
        <span className="text-zinc-200">Especificações Técnicas</span>
      </nav>

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <Gauge className="text-cyan-400" size={28} />
          <h1 className="text-3xl font-bold">Especificações Técnicas</h1>
        </div>
        <p className="text-zinc-400">
          Dados de fábrica do Chevrolet Prisma Maxx 1.0 8V Flexpower 2009/2010, com fonte citada para cada valor.
          Nada aqui foi estimado ou inventado — o que não pôde ser confirmado aparece marcado como não confirmado.
        </p>
      </div>

      {/* Especificações gerais */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Gauge className="text-cyan-400" size={22} />
          Especificações Gerais
        </h2>
        <div className="flex flex-col gap-6">
          {Array.from(specsBySystem.entries()).map(([system, rows]) => (
            <div key={system} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-800/50">
                <h3 className="font-semibold text-zinc-200">{SYSTEM_LABELS[system] ?? system}</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {rows.map(spec => (
                  <div key={spec.id} className="px-5 py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-zinc-400 text-sm">{spec.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-100 font-medium">
                          {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                        </span>
                        <ConfidenceBadge confidence={spec.confidence} />
                      </div>
                    </div>
                    {spec.notes && <p className="text-xs text-zinc-500">{spec.notes}</p>}
                    <SourceCitation references={specRefs.get(spec.id) ?? []} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fluidos e capacidades */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Droplets className="text-cyan-400" size={22} />
          Fluidos e Capacidades
        </h2>
        <div className="grid gap-4">
          {fluids.map(fluid => (
            <div key={fluid.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <h3 className="font-semibold text-zinc-100">{fluid.fluidType}</h3>
                <ConfidenceBadge confidence={fluid.confidence} />
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {fluid.specGrade && (
                  <div><dt className="text-zinc-500 text-xs">Especificação</dt><dd className="text-zinc-300">{fluid.specGrade}</dd></div>
                )}
                {fluid.capacity && (
                  <div><dt className="text-zinc-500 text-xs">Capacidade</dt><dd className="text-zinc-300">{fluid.capacity}</dd></div>
                )}
                {fluid.checkInterval && (
                  <div><dt className="text-zinc-500 text-xs">Verificação</dt><dd className="text-zinc-300">{fluid.checkInterval}</dd></div>
                )}
                {fluid.changeInterval && (
                  <div><dt className="text-zinc-500 text-xs">Troca</dt><dd className="text-zinc-300">{fluid.changeInterval}</dd></div>
                )}
              </dl>
              {fluid.notes && <p className="text-xs text-zinc-500 mt-2">{fluid.notes}</p>}
              <SourceCitation references={fluidRefs.get(fluid.id) ?? []} />
            </div>
          ))}
        </div>
      </section>

      {/* Plano de manutenção preventiva */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <CalendarClock className="text-cyan-400" size={22} />
          Plano de Manutenção Preventiva
        </h2>
        <p className="text-zinc-400 text-sm mb-4">
          Baseado no quadro oficial de revisões (a cada 10.000km ou 1 ano). Consulte também as{' '}
          <Link href="/parts" className="text-cyan-400 hover:underline">peças</Link> relacionadas a cada serviço.
        </p>
        <div className="flex flex-col gap-6">
          {Array.from(intervalsByCategory.entries()).map(([category, rows]) => (
            <div key={category} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-800/50">
                <h3 className="font-semibold text-zinc-200">{SYSTEM_LABELS[category] ?? category}</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {rows.map(interval => (
                  <div key={interval.id} className="px-5 py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-zinc-300 text-sm">{interval.service}</span>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {formatIntervalKm(interval.intervalKm) && (
                          <span className="text-xs bg-zinc-800 text-cyan-300 px-2 py-1 rounded-full">
                            {formatIntervalKm(interval.intervalKm)}
                            {interval.intervalMonths ? ` ou ${interval.intervalMonths} meses` : ''}
                          </span>
                        )}
                        <ConfidenceBadge confidence={interval.confidence} />
                      </div>
                    </div>
                    {interval.notes && <p className="text-xs text-zinc-500">{interval.notes}</p>}
                    <SourceCitation references={intervalRefs.get(interval.id) ?? []} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Torques de aperto */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="text-cyan-400" size={22} />
          Torques de Aperto
        </h2>
        {torques.length === 0 ? (
          <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-900/30">
            <p className="text-amber-200 text-sm">
              Nenhum torque de aperto está cadastrado ainda. O Manual do Proprietário Chevrolet Prisma (a fonte
              usada nesta pesquisa) não traz tabela de torques — esse dado pertence ao Manual de Reparação/Oficina
              da GM, que não é publicado gratuitamente. Para não inventar valores, esta seção permanece vazia até
              que uma fonte técnica confiável seja encontrada e citada.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {torques.map(torque => (
              <div key={torque.id} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-zinc-100 font-medium">{torque.component} — {torque.fastener}</p>
                  {torque.condition && <p className="text-xs text-zinc-500">{torque.condition}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-mono">
                    {torque.valueNm ? `${torque.valueNm} N.m` : ''}{torque.valueKgfm ? ` (${torque.valueKgfm} kgf.m)` : ''}
                  </span>
                  <ConfidenceBadge confidence={torque.confidence} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
