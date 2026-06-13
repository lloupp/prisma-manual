'use client';
import { ShoppingCart } from 'lucide-react';

interface MLButtonProps {
  href: string;
  size?: 'sm' | 'xs';
  label?: string;
}

export function MLButton({ href, size = 'xs', label = 'Mercado Livre' }: MLButtonProps) {
  const isSm = size === 'sm';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className={
        isSm
          ? 'inline-flex items-center gap-2 bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-400 hover:text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium transition border border-yellow-900/50 hover:border-yellow-700'
          : 'inline-flex items-center gap-1.5 bg-yellow-900/30 hover:bg-yellow-800/50 text-yellow-400 hover:text-yellow-300 px-2.5 py-1 rounded text-xs font-medium transition border border-yellow-900/40 hover:border-yellow-700 flex-shrink-0'
      }
    >
      <ShoppingCart size={isSm ? 15 : 12} />
      {label}
    </a>
  );
}
