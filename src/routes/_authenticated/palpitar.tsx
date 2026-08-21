import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCurrentRound, getMyBet, getMyStatus, saveBet, startPayment } from "@/lib/palpite.functions";
import { useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/palpitar")({
  head: () => ({
    meta: [
      { title: "Meu palpite — Palpite da Rodada" },
      { name: "description", content: "Informe o placar dos 10 jogos da rodada e confirme sua aposta." },
      { property: "og:title", content: "Meu palpite — Palpite da Rodada" },
      { property: "og:description", content: "Preencha os placares e pague sua aposta da rodada." },
    ],
  }),
  component: Palpitar,
});

type Placar = { home: string; away: string };

function Palpitar() {
  const navigate = useNavigate();
  const carregarRodada = useServerFn(getCurrentRound);
  const carregarAposta = useServerFn(getMyBet);
  const carregarStatus = useServerFn(getMyStatus);
  const salvar = useServerFn(saveBet);
  const pagar = useServerFn(startPayment);

  const [placares, setPlacares] = useState<Record<string, Placar>>({});
  const [enviando, setEnviando] = useState(false);

  const rodada = useQuery({ queryKey: ["rodada-atual"], queryFn: () => carregarRodada({}) });
  
  const fixturesQuery = useQuery({
    queryKey: ["fixtures-atuais"],
    queryFn: async () => {
      const res = await fetch("/api/public/get-fixtures");
      if (!res.ok) throw new Error("Falha ao buscar jogos da API");
      return res.json() as Promise<{ round: string; fixtures: any[] }>;
    }
  });

  const status = useQuery({ queryKey: ["meu-status"], queryFn: () => carregarStatus({}) });
  const roundId = rodada.data?.round?.id as string | undefined;

  const aposta = useQuery({
    queryKey: ["minha-aposta", roundId],
    queryFn: () => carregarAposta({ data: { roundId: roundId! } }),
    enabled: Boolean(roundId),
  });

  useEffect(() => {
    if (!aposta.data?.picks?.length) return;
    const next: Record<string, Placar> = {};
    for (const p of aposta.data.picks as any[]) {
      next[p.match_id] = { home: String(p.home_score), away: String(p.away_score) };
    }
    setPlacares(next);
  }, [aposta.data]);

  const matches = (rodada.data?.matches ?? []) as any[];
  const pago = aposta.data?.bet?.status === "paid";
  const aceitou = Boolean(status.data?.profile?.terms_accepted_at);
  const stats = rodada.data?.stats as any;
  const lotado = Number(stats?.paid_count ?? 0) >= Number(stats?.max_players ?? 100);

  const closesAt = rodada.data?.round?.closes_at ? new Date(rodada.data.round.closes_at) : null;
  const isClosed = !!(rodada.data?.round?.status !== "open" || (closesAt && closesAt < new Date()));

  function setPlacar(matchId: string, campo: keyof Placar, valor: string) {
    const limpo = valor.replace(/\D/g, "").slice(0, 2);
    setPlacares((p) => ({ ...p, [matchId]: { ...(p[matchId] ?? { home: "", away: "" }), [campo]: limpo } }));
  }

  async function salvarGratuito() {
    const picks = matches.map((m) => ({
      matchId: m.id as string,
      home: Number(placares[m.id]?.home ?? ""),
      away: Number(placares[m.id]?.away ?? ""),
    }));
    if (picks.some((p) => Number.isNaN(p.home) || Number.isNaN(p.away))) {
      toast.error("Preencha o placar de todos os jogos.");
      return;
    }
    setEnviando(true);
    try {
      await salvar({ data: { roundId: roundId!, picks } });
      toast.success("Seus palpites foram salvos gratuitamente!");
      await aposta.refetch();
      navigate({ to: "/meus-palpites" });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  async function entrarNoPremio() {
    const picks = matches.map((m) => ({
      matchId: m.id as string,
      home: Number(placares[m.id]?.home ?? ""),
      away: Number(placares[m.id]?.away ?? ""),
    }));
    if (picks.some((p) => Number.isNaN(p.home) || Number.isNaN(p.away))) {
      toast.error("Preencha o placar de todos os jogos antes de participar do prêmio.");
      return;
    }
    setEnviando(true);
    try {
      const { betId } = await salvar({ data: { roundId: roundId!, picks } });
      const { initPoint } = await pagar({ data: { betId, origin: window.location.origin } });
      window.location.href = initPoint;
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível iniciar o pagamento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {rodada.data?.round ? rodada.data.round.title || `Rodada ${rodada.data.round.number}` : "Rodada"}
          </h1>
          <Badge variant={pago ? "default" : "secondary"} className="w-fit">
            {pago ? "Participando do Prêmio" : "Palpite Gratuito"}
          </Badge>
        </div>

        {isClosed && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="py-6 text-center">
              <p className="font-bold text-destructive sm:text-lg">
                Esta rodada já está encerrada para novos palpites.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Acompanhe os resultados e sua pontuação na página "Meus Palpites".
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/meus-palpites">Ver meus palpites</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isClosed && !aceitou && (
          <Card>
            <CardContent className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
              <p className="text-sm">Aceite o regulamento para poder palpitar.</p>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/regulamento">Ir para o regulamento</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!rodada.data?.round && <p className="text-muted-foreground">Nenhuma rodada publicada ainda.</p>}

        {rodada.data?.round && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Placar dos jogos ({Number(stats?.paid_count ?? 0)}/{Number(stats?.max_players ?? 100)}{" "}
                apostadores pagantes)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-2 sm:p-6">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 rounded-lg border border-border p-2 sm:gap-2 sm:p-3"
                >
                  <div className="flex justify-end overflow-hidden">
                    <TeamBadge name={m.home_team} logo={m.home_logo} position="home" className="text-xs sm:text-sm" />
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Input
                      className="h-8 w-10 px-1 text-center sm:h-10 sm:w-12 sm:px-3"
                      inputMode="numeric"
                      disabled={pago || !aceitou || isClosed}
                      value={placares[m.id]?.home ?? ""}
                      onChange={(e) => setPlacar(m.id, "home", e.target.value)}
                      aria-label={`Gols do ${m.home_team}`}
                    />
                    <span className="text-xs text-muted-foreground sm:text-sm">x</span>
                    <Input
                      className="h-8 w-10 px-1 text-center sm:h-10 sm:w-12 sm:px-3"
                      inputMode="numeric"
                      disabled={pago || !aceitou || isClosed}
                      value={placares[m.id]?.away ?? ""}
                      onChange={(e) => setPlacar(m.id, "away", e.target.value)}
                      aria-label={`Gols do ${m.away_team}`}
                    />
                  </div>
                  <div className="flex justify-start overflow-hidden">
                    <TeamBadge name={m.away_team} logo={m.away_logo} position="away" className="text-xs sm:text-sm" />
                  </div>
                </div>
              ))}

              {pago ? (
                <p className="rounded-md bg-primary/10 p-3 text-sm font-medium text-primary">
                  Sua aposta está confirmada. Pontuação atual: {aposta.data?.bet?.total_points ?? 0} pontos.
                </p>
              ) : (
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={salvarGratuito}
                      disabled={enviando || !aceitou || matches.length === 0 || isClosed}
                    >
                      {enviando ? "Processando..." : "Salvar palpite gratuito"}
                    </Button>
                  </div>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold text-primary sm:text-lg">
                        Ganhe com seu Palpite
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Participe do prêmio da rodada depositando R$ 50,00. Apenas os 100 primeiros pagantes concorrem!
                      </p>
                      
                      {lotado ? (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
                          Limite de 100 participantes pagantes atingido para esta rodada. Aguarde a próxima!
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <Button
                            size="lg"
                            variant="default"
                            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                            onClick={entrarNoPremio}
                            disabled={enviando || !aceitou || matches.length === 0 || lotado || isClosed}
                          >
                            Depositar R$ 50,00 e Concorrer
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Vagas preenchidas: {Number(stats?.paid_count ?? 0)}/{Number(stats?.max_players ?? 100)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
