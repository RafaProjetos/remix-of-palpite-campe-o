import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Palpite da Rodada</p>
        <Link
          to="/privacidade"
          aria-label="Abrir Política de Privacidade"
          className="hover:text-foreground hover:underline"
        >
          Política de Privacidade
        </Link>
      </div>
    </footer>
  );
}
