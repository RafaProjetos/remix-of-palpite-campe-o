import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStatus } from "@/lib/palpite.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import logoAsset from "@/assets/logo.asset.json";
import { RoundDeadlineBar } from "@/components/round-deadline-bar";


export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const status = useQuery({ 
    queryKey: ["meu-status"], 
    queryFn: () => getMyStatus({}),
    enabled: !!email 
  });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link 
        to="/" 
        className={`rounded-md px-3 py-2 hover:bg-muted ${mobile ? "text-lg w-full" : ""}`}
        onClick={() => mobile && setOpen(false)}
      >
        Início
      </Link>
      <Link 
        to="/palpitar" 
        className={`rounded-md px-3 py-2 hover:bg-muted ${mobile ? "text-lg w-full" : ""}`}
        onClick={() => mobile && setOpen(false)}
      >
        Palpitar
      </Link>
      <Link 
        to="/meus-palpites" 
        className={`rounded-md px-3 py-2 hover:bg-muted ${mobile ? "text-lg w-full" : ""}`}
        onClick={() => mobile && setOpen(false)}
      >
        Meus Palpites
      </Link>
      <Link 
        to="/ranking" 
        className={`rounded-md px-3 py-2 hover:bg-muted ${mobile ? "text-lg w-full" : ""}`}
        onClick={() => mobile && setOpen(false)}
      >
        Ranking
      </Link>
      <Link 
        to="/regulamento" 
        className={`rounded-md px-3 py-2 hover:bg-muted ${mobile ? "text-lg w-full" : ""}`}
        onClick={() => mobile && setOpen(false)}
      >
        Regulamento
      </Link>
      {status.data?.isAdmin && (
        <Link 
          to="/admin" 
          className={`rounded-md px-3 py-2 hover:bg-muted ${mobile ? "text-lg w-full" : ""}`}
          onClick={() => mobile && setOpen(false)}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <img src={logoAsset.url} alt="Palpite da Rodada" className="h-12 w-auto sm:h-16" />
          <span className="sr-only">Palpite da Rodada</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <NavLinks />
          <div className="ml-2">
            {email ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Olá, {email.split('@')[0]}
                </span>
                <Button variant="outline" size="sm" onClick={sair}>
                  Sair
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link to="/entrar">Entrar</Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] p-6">
              <SheetTitle className="text-left font-logo text-xl mb-6">Menu</SheetTitle>
              <nav className="flex flex-col gap-4">
                <NavLinks mobile />
                <hr className="my-2 border-border" />
                {email ? (
                  <div className="flex flex-col gap-2">
                    <span className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border mb-2">
                      Usuário: {email.split('@')[0]}
                    </span>
                    <Button variant="outline" className="w-full justify-start" onClick={sair}>
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full justify-start" asChild onClick={() => setOpen(false)}>
                    <Link to="/entrar">Entrar</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <RoundDeadlineBar />
    </header>

  );
}
