export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Palpite da Rodada</p>
        <a href="/privacidade" className="hover:text-foreground hover:underline">
          Privacidade
        </a>
      </div>
    </footer>
  );
}
