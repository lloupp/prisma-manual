// TimeBadge.tsx
import { formatTime } from '../../lib/utils';

interface TimeBadgeProps {
  minutes: number;
}

export default function TimeBadge({ minutes }: TimeBadgeProps) {
  return (
    <span className="bg-blue-700/80 text-white rounded-full px-3 py-1 text-xs font-bold">
      {formatTime(minutes)}
    </span>
  );
}
