import { BookText } from 'lucide-react';

interface SourceCitationItem {
  id: string;
  page?: string | null;
  section?: string | null;
  notes?: string | null;
  source: {
    title: string;
    publisher: string;
    publicationYear?: number | null;
    url?: string | null;
  };
}

interface SourceCitationProps {
  references: SourceCitationItem[];
}

export default function SourceCitation({ references }: SourceCitationProps) {
  if (references.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {references.map(ref => (
        <div key={ref.id} className="flex items-start gap-2 text-xs text-zinc-500">
          <BookText size={13} className="mt-0.5 flex-shrink-0" />
          <p>
            {ref.source.url ? (
              <a href={ref.source.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-cyan-400 transition underline">
                {ref.source.title}
              </a>
            ) : (
              <span className="text-zinc-400">{ref.source.title}</span>
            )}
            {ref.source.publisher && <> — {ref.source.publisher}</>}
            {ref.source.publicationYear && <> ({ref.source.publicationYear})</>}
            {ref.section && <>, {ref.section}</>}
            {ref.page && <>, p. {ref.page}</>}
            {ref.notes && <span className="block text-zinc-500 italic mt-0.5">{ref.notes}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}
