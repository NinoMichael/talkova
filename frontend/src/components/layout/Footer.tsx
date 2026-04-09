export function Footer() {
  return (
    <footer className="px-8 py-6 text-center text-[var(--color-muted)] text-sm">
      © {new Date().getFullYear()} Talkova. Tous droits réservés.
    </footer>
  );
}