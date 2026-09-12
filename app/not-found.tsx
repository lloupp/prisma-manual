import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <SearchX className="text-cyan-500" size={48} />
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-zinc-400 max-w-md">
        O sistema, peça ou guia que você procura não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 mt-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition no-underline"
      >
        <ArrowLeft size={16} />
        Voltar ao Manual
      </Link>
    </div>
  );
}
