import { type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: ReactNode;
  headerVariant?: 'transparent' | 'solid';
}

export function MainLayout({ children, headerVariant = 'transparent' }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant={headerVariant} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}