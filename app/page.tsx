// page.tsx
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
