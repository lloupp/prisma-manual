// InfoCard.tsx
import { Part } from '../../types';

interface InfoCardProps {
  part: Part;
}

export default function InfoCard({ part }: InfoCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow flex flex-col gap-2">
      <h4 className="font-bold text-lg">{part.name}</h4>
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-300">P/N: {part.partNumber}</span>
        <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-300">{part.brand}</span>
      </div>
      <p className="text-zinc-300 text-sm mt-1">{part.description}</p>
      <p className="text-zinc-500 text-xs">Posição: {part.position}</p>
      <div className="mt-2">
        <p className="text-zinc-400 text-xs font-semibold mb-1">Sintomas relacionados:</p>
        <div className="flex flex-wrap gap-1">
          {part.symptoms.map((sintoma, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-red-900/30 rounded text-red-300">{sintoma}</span>
          ))}
        </div>
      </div>
      <p className="text-zinc-500 text-xs mt-2">Intervalo: {part.replacementInterval}</p>
      <p className="text-cyan-400 text-sm font-medium">Faixa de preço: {part.priceRange}</p>
    </div>
  );
}