interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center' 
    : 'flex items-center justify-center py-8';
  
  return (
    <div className={containerClass}>
      <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}