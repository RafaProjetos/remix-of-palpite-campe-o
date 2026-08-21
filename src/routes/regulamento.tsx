import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { acceptTerms, getMyStatus } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/regulamento")({
  head: () => ({
    meta: [
      { title: "Regulamento — Palpite da Rodada" },
      {
        name: "description",
        content:
          "Regras de pontuação, limite de 100 apostadores, valor de R$ 50 por rodada e autorização de uso de dados do Palpite da Rodada.",
      },
      { property: "og:title", content: "Regulamento — Palpite da Rodada" },
      { property: "og:description", content: "Como funciona a pontuação e a participação no bolão." },
    ],
  }),
  component: Regulamento,
});

const REGRAS = [
  ["Placar exato do jogo", "30 pontos"],
  ["Acertar apenas o time vencedor", "10 pontos"],
  ["Palpitar empate e sair empate com outro placar", "15 pontos"],
  ["Acertar o placar de apenas um dos times", "5 pontos"],
  ["Acertar a diferença de gols", "2 pontos"],
];

function Regulamento() {
  const navigate = useNavigate();
  const aceitar = useServerFn(acceptTerms);
  const status = useServerFn(getMyStatus);
  const [logado, setLogado] = useState(false);
  const [jaAceito, setJaAceito] = useState(false);
  const [ciente, setCiente] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setLogado(true);
      try {
        const s = await status({});
        setJaAceito(Boolean(s.profile?.terms_accepted_at));
      } catch {
        /* silencioso */
      }
    });
  }, [status]);

  async function confirmar() {
    if (!ciente) {
      toast.error("Marque a autorização para continuar.");
      return;
    }
    setEnviando(true);
    try {
      await aceitar({ data: {} });
      toast.success("Regulamento aceito! Bons palpites.");
      navigate({ to: "/palpitar" });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar o aceite.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Regulamento</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground sm:text-base">
            <p>
              O <strong>Palpite da Rodada</strong> é um concurso de prognósticos baseado nos jogos da Série A do Brasileirão 2026. 
              A cada rodada, você pode dar palpites em 10 jogos selecionados.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Modalidade Gratuita:</strong> Participe sem custo e acompanhe seu desempenho no ranking.</li>
              <li><strong>Modalidade Premium:</strong> Por apenas R$ 50,00, você concorre a prêmios em dinheiro. Esta modalidade é limitada a <strong>100 participantes</strong> por rodada.</li>
              <li><strong>Fechamento:</strong> Os palpites encerram automaticamente no horário de início do primeiro jogo da rodada.</li>
              <li><strong>Dados:</strong> Seus dados são usados exclusivamente para identificar suas apostas e processar prêmios, conforme a LGPD.</li>
            </ul>
            <div className="pt-2 border-t mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Leia o regulamento completo. Baixe aqui:</p>
              <a 
                href="/docs/regulamento.pdf" 
                download 
                className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Baixar Regulamento PDF
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pontuação por jogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:p-6">
            {REGRAS.map(([regra, pontos]) => (
              <div key={regra} className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
                <span className="text-sm sm:text-base">{regra}</span>
                <span className="text-sm font-bold text-primary sm:text-base">{pontos}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground sm:text-sm">
              O placar exato vale 30 pontos e substitui os demais critérios. Os outros critérios podem ser
              somados entre si no mesmo jogo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Uso de dados e autorização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground sm:text-base">
              Seus dados (nome, e-mail, telefone e palpites) são utilizados restritamente dentro do aplicativo
              Palpite da Rodada, para identificar sua aposta, processar o pagamento e exibir seu nome nos
              rankings. Não compartilhamos seus dados com terceiros.
            </p>

            {!logado && (
              <p className="rounded-lg bg-muted p-3 text-sm sm:text-base">
                Faça seu cadastro ou entre na plataforma para registrar o aceite do regulamento.
              </p>
            )}

            {logado && jaAceito && (
              <p className="rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary sm:text-base">
                Você já aceitou o regulamento. Pode palpitar à vontade!
              </p>
            )}

            {logado && !jaAceito && (
              <div className="space-y-6">
                <label className="flex items-start gap-3 text-sm sm:text-base">
                  <Checkbox checked={ciente} onCheckedChange={(v) => setCiente(Boolean(v))} className="mt-1" />
                  <span>
                    Li e estou ciente das regras do Palpite da Rodada e autorizo o uso dos meus dados
                    restritamente dentro do aplicativo.
                  </span>
                </label>
                <Button onClick={confirmar} disabled={enviando} className="w-full sm:w-auto">
                  {enviando ? "Salvando..." : "Aceito os termos do regulamento."}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
