// app/components/search/SearchBar.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form onSubmit={handleSearch} className="relative w-full md:w-80">
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 gap-2">
        <Search className="text-zinc-500 flex-shrink-0" size={20} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar sistema, peça ou guia..."
          className="bg-transparent outline-none text-zinc-100 placeholder:text-zinc-400 flex-1"
          aria-label="Buscar"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="text-zinc-500 hover:text-zinc-300 transition"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
}