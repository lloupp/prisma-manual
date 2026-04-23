// layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import AppShell from '../components/layout/AppShell';
import ThemeProviders from '../components/layout/ThemeProviders';

export const metadata = {
  title: 'Manual de Manutenção Prisma',
  description: 'Seu guia visual, rápido e inteligente para manutenção do Chevrolet Prisma.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProviders>
          <AppShell>
            {children}
          </AppShell>
        </ThemeProviders>
      </body>
    </html>
  );
}
