import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getCurrentRound, getMyBet, getMyStatus, saveBet, startPayment, getLeagues, getLeagueStats } from "@/lib/palpite.functions";
import { useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/palpitar")({
  head: () => ({
    meta: [
      { title: "Meu palpite — Palpite da Rodada" },
      { name: "description", content: "Escolha sua liga, informe o placar dos 10 jogos e confirme sua aposta." },
      { property: "og:title", content: "Meu palpite — Palpite da Rodada" },
      { property: "og:description", content: "Participe das ligas gratuitas e pagas e ganhe prêmios." },
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
  const carregarLigas = useServerFn(getLeagues);
  const carregarLeagueStats = useServerFn(getLeagueStats);
  const salvar = useServerFn(saveBet);
  const pagar = useServerFn(startPayment);

  const [placares, setPlacares] = useState<Record<string, Placar>>({});
  const [enviando, setEnviando] = useState(false);
  const [activeLeagueType, setActiveLeagueType] = useState<string>("free");

  const rodada = useQuery({ queryKey: ["rodada-atual"], queryFn: () => carregarRodada({}) });
  
  const ligas = useQuery({ queryKey: ["leagues"], queryFn: () => carregarLigas({}) });
  const activeLeague = ligas.data?.find(l => l.type === activeLeagueType);

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
    queryKey: ["minha-aposta", roundId, activeLeague?.id],
    queryFn: () => carregarAposta({ data: { roundId: roundId!, leagueId: activeLeague?.id } }),
    enabled: Boolean(roundId) && Boolean(activeLeague?.id),
  });

  const leagueStats = useQuery({
    queryKey: ["league-stats", roundId, activeLeagueType],
    queryFn: () => carregarLeagueStats({ data: { roundId: roundId!, leagueType: activeLeagueType } }),
    enabled: Boolean(roundId),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!aposta.data?.picks?.length) {
      setPlacares({});
      return;
    }
    const next: Record<string, Placar> = {};
    for (const p of aposta.data.picks as any[]) {
      next[p.match_id] = { home: String(p.home_score), away: String(p.away_score) };
    }
    setPlacares(next);
  }, [aposta.data]);

  const matches = (rodada.data?.matches ?? []) as any[];
  const pago = aposta.data?.bet?.status === "paid";
  const aceitou = Boolean(status.data?.profile?.terms_accepted_at);

  const closesAt = rodada.data?.round?.closes_at ? new Date(rodada.data.round.closes_at) : null;
  const isClosed = !!(rodada.data?.round?.status !== "open" || (closesAt && closesAt < new Date()));

  function setPlacar(matchId: string, campo: keyof Placar, valor: string) {
    const limpo = valor.replace(/\D/g, "").slice(0, 2);
    setPlacares((p) => ({ ...p, [matchId]: { ...(p[matchId] ?? { home: "", away: "" }), [campo]: limpo } }));
  }

  async function salvarPalpite() {
    if (!activeLeague) return;
    const currentMatches = fixturesQuery.data?.fixtures || matches;
    const picks = currentMatches.map((m: any) => ({
      matchId: (m.id || m.match_id) as string,
      home: Number(placares[m.id]?.home ?? ""),
      away: Number(placares[m.id]?.away ?? ""),
    }));
    if (picks.some((p: any) => Number.isNaN(p.home) || Number.isNaN(p.away))) {
      toast.error("Preencha o placar de todos os jogos.");
      return;
    }
    setEnviando(true);
    try {
      const { betId } = await salvar({ data: { roundId: roundId!, leagueId: activeLeague.id, picks } });
      
      if (activeLeague.type !== 'free') {
        const { initPoint } = await pagar({ data: { betId, origin: window.location.origin } });
        window.location.href = initPoint;
      } else {
        toast.success("Seus palpites foram salvos na Liga Free!");
        await aposta.refetch();
        navigate({ to: "/meus-palpites" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  const netPot = Number(leagueStats.data?.net_pot ?? 0);
  const participants = Number(leagueStats.data?.total_participants ?? 0);

  const premiações = [
    { pos: "1º", pct: 0.35 },
    { pos: "2º", pct: 0.20 },
    { pos: "3º", pct: 0.12 },
    { pos: "4º", pct: 0.08 },
    { pos: "5º", pct: 0.06 },
    { pos: "6º ao 10º", pct: 0.038 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {fixturesQuery.data?.round || (rodada.data?.round ? (rodada.data.round.title || `Rodada ${rodada.data.round.number}`) : "Rodada")}
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
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Termos de Uso e Regulamento</h2>
                <p className="text-muted-foreground">Você precisa aceitar os termos antes de começar a palpitar.</p>
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/regulamento">Ler e aceitar o regulamento</Link>
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
              {fixturesQuery.isLoading && <p className="text-center py-4 text-muted-foreground">Carregando jogos...</p>}
              
              {!fixturesQuery.isLoading && fixturesQuery.data?.fixtures && fixturesQuery.data.fixtures.map((f: any) => (
                <div
                  key={f.id}
                  className="flex flex-col rounded-lg border border-border p-3 space-y-3"
                >
                  <div className="flex justify-center items-center text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    <span>
                      {new Date(f.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} • {new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {f.venue && <span className="mx-1.5">•</span>}
                    {f.venue && <span className="truncate max-w-[150px]">{f.venue}</span>}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex justify-end overflow-hidden">
                      <TeamBadge name={f.homeTeam.name} logo={f.homeTeam.logo} position="home" className="text-xs sm:text-sm" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Input
                        className="h-8 w-10 px-1 text-center sm:h-10 sm:w-12 sm:px-3"
                        inputMode="numeric"
                        disabled={pago || !aceitou || isClosed}
                        value={placares[f.id]?.home ?? ""}
                        onChange={(e) => setPlacar(f.id, "home", e.target.value)}
                        aria-label={`Gols do ${f.homeTeam.name}`}
                      />
                      <span className="text-xs text-muted-foreground sm:text-sm">x</span>
                      <Input
                        className="h-8 w-10 px-1 text-center sm:h-10 sm:w-12 sm:px-3"
                        inputMode="numeric"
                        disabled={pago || !aceitou || isClosed}
                        value={placares[f.id]?.away ?? ""}
                        onChange={(e) => setPlacar(f.id, "away", e.target.value)}
                        aria-label={`Gols do ${f.awayTeam.name}`}
                      />
                    </div>
                    <div className="flex justify-start overflow-hidden">
                      <TeamBadge name={f.awayTeam.name} logo={f.awayTeam.logo} position="away" className="text-xs sm:text-sm" />
                    </div>
                  </div>
                </div>
              ))}

              {!fixturesQuery.isLoading && !fixturesQuery.data?.fixtures && matches.map((m) => (
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
                      disabled={enviando || !aceitou || (matches.length === 0 && !fixturesQuery.data?.fixtures) || isClosed}
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
                            disabled={enviando || !aceitou || (matches.length === 0 && !fixturesQuery.data?.fixtures) || lotado || isClosed}
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
