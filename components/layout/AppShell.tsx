// AppShell.tsx
import { ReactNode } from 'react';
import AppHeader from './AppHeader';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <AppHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 md:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
