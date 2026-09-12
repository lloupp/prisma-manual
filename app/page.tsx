// page.tsx
import Link from 'next/link';
import { Gauge, ScanLine, History } from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import CategoryCard from '../components/cards/CategoryCard';
import CarPreviewCard from '../components/cards/CarPreviewCard';
import { getSystems } from '../lib/selectors';

export default async function HomePage() {
 const categorias = await getSystems();
  return (
    <main className="p-6 flex flex-col gap-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center">Manual de Manutenção Prisma</h1>
      <p className="text-center text-lg text-zinc-400 max-w-2xl mx-auto">Seu guia visual para manutenções inteligentes, rápidas e seguras do Chevrolet Prisma.</p>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
        <SearchBar />
        <CarPreviewCard />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/especificacoes"
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-5 transition no-underline"
        >
          <Gauge className="text-cyan-400 flex-shrink-0" size={28} />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Especificações Técnicas</h2>
            <p className="text-sm text-zinc-400">Motor, elétrica, fluidos, plano de manutenção preventiva e torques — cada dado com sua fonte.</p>
          </div>
        </Link>
        <Link
          href="/scanner"
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-5 transition no-underline"
        >
          <ScanLine className="text-cyan-400 flex-shrink-0" size={28} />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Scanner OBD</h2>
            <p className="text-sm text-zinc-400">Conecte o adaptador OBD-USB e veja dados ao vivo, DTCs e freeze frame do seu Prisma. Somente leitura.</p>
          </div>
        </Link>
        <Link
          href="/historico"
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-5 transition no-underline"
        >
          <History className="text-cyan-400 flex-shrink-0" size={28} />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Histórico</h2>
            <p className="text-sm text-zinc-400">Sessões de diagnóstico OBD anteriores - o prontuário do seu Prisma.</p>
          </div>
        </Link>
      </div>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Categorias de Sistemas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categorias.map((cat) => (
            <CategoryCard key={cat.id} categoria={cat} />
          ))}
        </div>
      </section>
    </main>
  );
}
