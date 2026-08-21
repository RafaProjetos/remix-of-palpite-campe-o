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
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {fixturesQuery.data?.round || (rodada.data?.round ? (rodada.data.round.title || `Rodada ${rodada.data.round.number}`) : "Rodada")}
            </h1>
            <p className="text-muted-foreground text-sm">Escolha sua liga e dê seu palpite.</p>
          </div>
        </div>

        {isClosed && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="py-6 text-center">
              <p className="font-bold text-destructive sm:text-lg">
                Esta rodada já está encerrada para novos palpites.
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

        {rodada.data?.round && (
          <Tabs defaultValue="free" className="w-full" onValueChange={setActiveLeagueType}>
            <TabsList className="grid w-full grid-cols-4 h-12 mb-6">
              <TabsTrigger value="free" className="text-xs sm:text-sm">Free</TabsTrigger>
              <TabsTrigger value="bronze" className="text-xs sm:text-sm">Bronze</TabsTrigger>
              <TabsTrigger value="prata" className="text-xs sm:text-sm">Prata</TabsTrigger>
              <TabsTrigger value="ouro" className="text-xs sm:text-sm">Ouro</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Pote Líquido</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {activeLeagueType === 'free' ? "Troféus" : `R$ ${netPot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Participantes</span>
                  </div>
                  <div className="text-2xl font-bold">{participants}</div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Custo de Entrada</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {activeLeague?.entry_fee === 0 ? "Grátis" : `R$ ${Number(activeLeague?.entry_fee).toFixed(2)}`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {activeLeagueType !== 'free' && (
              <Card className="mb-8 border-yellow-500/20 bg-yellow-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    SIMULAÇÃO DE PRÊMIOS (TOP 10)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {premiações.map(p => (
                      <div key={p.pos} className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{p.pos} Lugar</span>
                        <span className="text-sm font-bold">
                          R$ {(netPot * p.pct).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Seus Palpites - {activeLeague?.name}
                  </CardTitle>
                  <Badge variant={pago ? "default" : "secondary"}>
                    {pago ? "Confirmado" : activeLeagueType === 'free' ? "Gratuito" : "Pendente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-2 sm:p-6">
                {fixturesQuery.isLoading && <p className="text-center py-8">Carregando jogos...</p>}
                
                {!fixturesQuery.isLoading && (fixturesQuery.data?.fixtures || matches).map((f: any) => {
                  const matchId = f.id || f.match_id;
                  const homeName = f.homeTeam?.name || f.home_team;
                  const homeLogo = f.homeTeam?.logo || f.home_logo;
                  const awayName = f.awayTeam?.name || f.away_team;
                  const awayLogo = f.awayTeam?.logo || f.away_logo;

                  return (
                    <div key={matchId} className="flex flex-col rounded-lg border border-border p-3 space-y-3">
                      <div className="flex justify-center items-center text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        <span>
                          {f.date ? new Date(f.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : 
                           f.kickoff_at ? new Date(f.kickoff_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : ""}
                          {' • '}
                          {f.date ? new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
                           f.kickoff_at ? new Date(f.kickoff_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                        {f.venue && <><span className="mx-1.5">•</span><span>{f.venue}</span></>}
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-4">
                        <div className="flex justify-center min-w-0">
                          <TeamBadge 
                            name={homeName} 
                            logo={homeLogo} 
                            position="home" 
                            className="text-[10px] sm:text-sm" 
                            layout="vertical" 
                            hideNameOnMobile={true}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 w-8 px-0.5 text-center text-xs sm:h-10 sm:w-12 sm:px-3 sm:text-base"
                            inputMode="numeric"
                            disabled={pago || !aceitou || isClosed}
                            value={placares[matchId]?.home ?? ""}
                            onChange={(e) => setPlacar(matchId, "home", e.target.value)}
                          />
                          <span className="text-[10px] text-muted-foreground sm:text-sm">x</span>
                          <Input
                            className="h-7 w-8 px-0.5 text-center text-xs sm:h-10 sm:w-12 sm:px-3 sm:text-base"
                            inputMode="numeric"
                            disabled={pago || !aceitou || isClosed}
                            value={placares[matchId]?.away ?? ""}
                            onChange={(e) => setPlacar(matchId, "away", e.target.value)}
                          />
                        </div>
                        <div className="flex justify-center min-w-0">
                          <TeamBadge 
                            name={awayName} 
                            logo={awayLogo} 
                            position="away" 
                            className="text-[10px] sm:text-sm" 
                            layout="vertical" 
                            hideNameOnMobile={true}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-6">
                  {pago ? (
                    <div className="rounded-md bg-green-500/10 p-4 border border-green-500/20 text-center">
                      <p className="text-sm font-bold text-green-700">
                        Seus palpites na {activeLeague?.name} estão confirmados!
                      </p>
                      <p className="text-xs text-green-600 mt-1">Pontuação: {aposta.data?.bet?.total_points ?? 0} pts</p>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={salvarPalpite}
                      disabled={enviando || !aceitou || isClosed || fixturesQuery.isLoading}
                    >
                      {enviando ? "Processando..." : activeLeagueType === 'free' ? "Salvar Palpite Gratuito" : `Participar da Liga (R$ ${Number(activeLeague?.entry_fee).toFixed(2)})`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Tabs>
        )}
      </main>
    </div>
  );
}
