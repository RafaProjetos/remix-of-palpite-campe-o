import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { syncMyPendingBets } from "@/lib/palpite.functions";

export const Route = createFileRoute("/pagamento")({
  head: () => ({
    meta: [
      { title: "Pagamento — Palpite da Rodada" },
      { name: "description", content: "Situação do pagamento da sua aposta no Palpite da Rodada." },
      { property: "og:title", content: "Pagamento — Palpite da Rodada" },
      { property: "og:description", content: "Confirmação do pagamento da aposta da rodada." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search["status"] === "string" ? (search["status"] as string) : "",
  }),
  component: Pagamento,
});

const TEXTOS: Record<string, { titulo: string; texto: string }> = {
  sucesso: {
    titulo: "Pagamento aprovado!",
    texto: "Sua aposta foi confirmada. Boa sorte na rodada e acompanhe o ranking em tempo real.",
  },
  pendente: {
    titulo: "Pagamento pendente",
    texto: "Assim que o Mercado Pago confirmar o pagamento, sua aposta será liberada automaticamente.",
  },
  falha: {
    titulo: "Pagamento não concluído",
    texto: "O pagamento não foi finalizado. Você pode tentar novamente pela tela de palpites.",
  },
};

function Pagamento() {
  const { status } = Route.useSearch();
  const syncBets = useServerFn(syncMyPendingBets);
  const [syncing, setSyncing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Ao voltar do checkout do Mercado Pago, sincroniza automaticamente as
  // apostas pendentes — garante a confirmação mesmo se o webhook não chegar.
  useEffect(() => {
    if (status === "falha") return;
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      setSyncing(true);
      try {
        const result = await syncBets();
        if (cancelled) return;
        if (result.approved > 0) {
          setConfirmed(true);
          toast.success("Pagamento confirmado! Sua aposta foi efetivada.");
        }
      } catch {
        // usuário sem sessão válida ou falha de rede — a tela de palpites
        // ainda oferece a sincronização manual
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const info = TEXTOS[confirmed ? "sucesso" : status] ?? {
    titulo: "Situação do pagamento",
    texto: "Confira na tela de palpites a situação atual da sua aposta.",
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncing ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : confirmed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : null}
              {info.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {syncing ? "Confirmando seu pagamento com o Mercado Pago..." : info.texto}
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/palpitar">Meus palpites</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/ranking">Ver ranking</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
