import { ShieldCheck, ShieldQuestion, BadgeCheck, Users } from 'lucide-react';
import { Confidence } from '../../types/enums';

interface ConfidenceBadgeProps {
  confidence: Confidence | string;
  size?: 'sm' | 'xs';
}

const CONFIG: Record<string, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  OFFICIAL: {
    label: 'Fonte oficial GM/Chevrolet',
    className: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
    Icon: ShieldCheck,
  },
  OEM: {
    label: 'Confirmado pelo fabricante do componente',
    className: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
    Icon: BadgeCheck,
  },
  CROSS_VERIFIED: {
    label: 'Confirmado por múltiplas fontes independentes',
    className: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    Icon: Users,
  },
  UNVERIFIED: {
    label: 'Informação ainda não confirmada por documentação técnica',
    className: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    Icon: ShieldQuestion,
  },
};

export default function ConfidenceBadge({ confidence, size = 'xs' }: ConfidenceBadgeProps) {
  const config = CONFIG[confidence] ?? CONFIG.UNVERIFIED;
  const { label, className, Icon } = config;
  const isSm = size === 'sm';

  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${className} ${
        isSm ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      <Icon size={isSm ? 13 : 11} />
      {label}
    </span>
  );
}
