import { Link } from 'react-router-dom';
import { Logo } from '../features/Logo';

interface HeaderProps {
  variant?: 'transparent' | 'solid';
}

export function Header({ variant = 'transparent' }: HeaderProps) {
  return (
    <header className={`flex items-center justify-between px-6 lg:px-12 py-5 ${variant === 'solid' ? 'bg-surface shadow-sm' : ''}`}>
      <Logo size="sm" />
      <nav className="flex items-center gap-3">
        <Link
          to="/login"
          className="px-5 py-2.5 text-primary-dark font-medium hover:text-primary transition-colors"
        >
          Connexion
        </Link>
        <Link
          to="/register"
          className="px-5 py-2.5 bg-primary text-primary-dark font-medium rounded-lg hover:bg-primary-light transition-colors"
        >
          Inscription
        </Link>
      </nav>
    </header>
  );
}