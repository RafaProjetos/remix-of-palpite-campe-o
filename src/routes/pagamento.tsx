import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const info = TEXTOS[status] ?? {
    titulo: "Situação do pagamento",
    texto: "Confira na tela de palpites a situação atual da sua aposta.",
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>{info.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{info.texto}</p>
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
