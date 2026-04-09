import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export function Logo({ size = 'md', withText = true }: LogoProps) {
  const sizes = {
    sm: { container: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-lg' },
    md: { container: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-2xl' },
    lg: { container: 'w-14 h-14', icon: 'w-8 h-8', text: 'text-4xl' },
  };

  const s = sizes[size];

  return (
    <Link to="/" className={`flex items-center gap-2 group`}>
      <div className={`${s.container} bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
        <svg viewBox="0 0 24 24" className={`${s.icon} text-primary-dark`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 9h8M8 13h6" strokeWidth="1.5" />
        </svg>
      </div>
      {withText && (
        <span className={`${s.text} font-bold text-primary-dark tracking-tight`}>
          Talkova
        </span>
      )}
    </Link>
  );
}

export function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <rect width="32" height="32" rx="8" fill="#89c9b8" />
      <path d="M24 20a2 2 0 0 1-2 2H10l-4-4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14z" fill="#092532" />
      <path d="M10 10h8M10 14h6" stroke="#89c9b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}