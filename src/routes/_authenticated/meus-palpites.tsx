import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getMyBet, getMyStatus } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/meus-palpites")({
  head: () => ({
    meta: [
      { title: "Meus Palpites — Palpite da Rodada" },
      { name: "description", content: "Visualize seus palpites e acompanhe sua pontuação." },
    ],
  }),
  component: MeusPalpites,
});

function MeusPalpites() {
  const carregarRodada = useServerFn(getCurrentRound);
  const carregarAposta = useServerFn(getMyBet);
  const carregarStatus = useServerFn(getMyStatus);

  const rodada = useQuery({ queryKey: ["rodada-atual"], queryFn: () => carregarRodada({}) });
  const status = useQuery({ queryKey: ["meu-status"], queryFn: () => carregarStatus({}) });
  const roundId = rodada.data?.round?.id as string | undefined;

  const aposta = useQuery({
    queryKey: ["minha-aposta", roundId],
    queryFn: () => carregarAposta({ data: { roundId: roundId! } }),
    enabled: Boolean(roundId),
  });

  if (rodada.isLoading || status.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-10">Carregando...</main>
      </div>
    );
  }

  const round = rodada.data?.round;
  const matches = (rodada.data?.matches ?? []) as any[];
  const picks = (aposta.data?.picks ?? []) as any[];
  const pickMap = new Map(picks.map((p) => [p.match_id, p]));
  const totalPoints = aposta.data?.bet?.total_points ?? 0;
  
  const isValidated = round?.status === "validated";
  const isClosed = 
    round?.status !== "open" || 
    (round?.closes_at && new Date(round.closes_at) < new Date());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Meus Palpites</h1>
            {round && (
              <p className="text-sm text-muted-foreground">
                {round.title} • {isClosed ? "Encerrada" : "Aberta até " + new Date(round.closes_at!).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(isClosed || totalPoints > 0) && (
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium uppercase text-muted-foreground">{isValidated ? "Pontuação Final" : "Pontuação Parcial"}</span>
                <span className="text-2xl font-black text-primary">{totalPoints} pts</span>
              </div>
            )}
            <Badge variant={isClosed ? "secondary" : "default"} className="h-fit">
              {isClosed ? "Palpites encerrados" : "Rodada Aberta"}
            </Badge>
          </div>
        </div>

        {!aposta.data?.bet ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <p className="mb-4 text-muted-foreground">Você ainda não enviou palpites para esta rodada.</p>
              <Button asChild>
                <Link to="/palpitar">Fazer meu palpite</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 py-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg">Seus Placares</CardTitle>
                  <p className="text-xs text-muted-foreground">Acompanhe seus pontos em tempo real</p>
                </div>
                {!isClosed && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/palpitar">Editar Palpites</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3 p-2 sm:p-6">
                {matches.map((m) => {
                  const pick = pickMap.get(m.id);
                  const hasResult = m.home_score !== null && m.away_score !== null;
                  const points = pick?.points ?? 0;
                  
                  return (
                    <div
                      key={m.id}
                      className="relative overflow-hidden rounded-lg border border-border bg-muted/30 p-3 transition-all hover:bg-muted/40 sm:p-4"
                    >
                      {/* Pontuação do Jogo */}
                      {hasResult && (
                        <div className={`absolute top-0 right-0 rounded-bl-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${points > 0 ? 'bg-green-600' : 'bg-muted-foreground/50'}`}>
                          {points > 0 ? `+${points} pts` : '0 pts'}
                        </div>
                      )}

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                        {/* Time Mandante */}
                        <div className="flex flex-col items-end gap-1 overflow-hidden text-right">
                          <TeamBadge name={m.home_team} logo={m.home_logo} position="home" className="text-xs font-bold sm:text-sm" />
                          {hasResult && (
                            <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                              Real: <span className="text-foreground">{m.home_score}</span>
                            </span>
                          )}
                        </div>

                        {/* Placar do Palpite */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex h-8 w-9 items-center justify-center rounded bg-background font-black text-primary shadow-sm ring-1 ring-primary/20 sm:h-10 sm:w-11 sm:text-lg">
                              {pick?.home_score ?? "-"}
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">x</span>
                            <div className="flex h-8 w-9 items-center justify-center rounded bg-background font-black text-primary shadow-sm ring-1 ring-primary/20 sm:h-10 sm:w-11 sm:text-lg">
                              {pick?.away_score ?? "-"}
                            </div>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70 sm:text-[10px]">
                            Seu Palpite
                          </span>
                        </div>

                        {/* Time Visitante */}
                        <div className="flex flex-col items-start gap-1 overflow-hidden text-left">
                          <TeamBadge name={m.away_team} logo={m.away_logo} position="away" className="text-xs font-bold sm:text-sm" />
                          {hasResult && (
                            <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                              Real: <span className="text-foreground">{m.away_score}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {aposta.data.bet.status === "paid" && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm font-semibold text-primary shadow-sm">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  $
                </div>
                Você está participando do prêmio desta rodada!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
