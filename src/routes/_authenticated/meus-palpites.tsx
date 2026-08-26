import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getMyBet, getMyBetsForRound, getMyStatus, getRounds, startPayment, syncPaymentStatus } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const carregarListaRodadas = useServerFn(getRounds);
  const dispararPagamento = useServerFn(startPayment);
  const sincronizarPagamento = useServerFn(syncPaymentStatus);

  const carregarMinhasApostas = useServerFn(getMyBetsForRound);

  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const listaRodadas = useQuery({ queryKey: ["lista-rodadas"], queryFn: () => carregarListaRodadas({}) });
  const rodada = useQuery({ 
    queryKey: ["rodada", selectedRoundId], 
    queryFn: () => carregarRodada({ data: { roundId: selectedRoundId || null } }) 
  });
  const status = useQuery({ queryKey: ["meu-status"], queryFn: () => carregarStatus({ data: undefined }) });
  
  useEffect(() => {
    const firstRound = listaRodadas.data?.[0];
    if (firstRound && !selectedRoundId) {
      setSelectedRoundId(firstRound.id);
    }
  }, [listaRodadas.data]);

  const roundId = rodada.data?.round?.id as string | undefined;

  const minhasApostas = useQuery({
    queryKey: ["minhas-apostas", roundId],
    queryFn: () => carregarMinhasApostas({ data: { roundId: roundId! } }),
    enabled: Boolean(roundId),
  });

  const apostasRodada = (minhasApostas.data ?? []) as any[];

  useEffect(() => {
    if (!apostasRodada.length) {
      setSelectedLeagueId("");
      return;
    }
    if (!apostasRodada.some((b) => b.league_id === selectedLeagueId)) {
      setSelectedLeagueId(apostasRodada[0].league_id);
    }
  }, [minhasApostas.data]);

  const aposta = useQuery({
    queryKey: ["minha-aposta", roundId, selectedLeagueId],
    queryFn: () => carregarAposta({ data: { roundId: roundId!, leagueId: selectedLeagueId || undefined } }),
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
  const betLeague = (aposta.data?.bet as any)?.leagues;
  const betStatus = aposta.data?.bet?.status;
  
  const isPaidLeague = betLeague?.type && betLeague.type !== 'free';
  const isPending = isPaidLeague && betStatus !== 'paid';

  const handleFinishPayment = async () => {
    if (!aposta.data?.bet?.id) return;
    
    setIsPaying(true);
    try {
      const { initPoint } = await dispararPagamento({
        data: {
          betId: aposta.data.bet.id,
          origin: window.location.origin,
        },
      });
      window.location.href = initPoint;
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar pagamento");
      setIsPaying(false);
    }
  };
  
  const handleSyncStatus = async () => {
    if (!aposta.data?.bet?.id) return;
    
    setIsSyncing(true);
    try {
      const res = await sincronizarPagamento({
        data: { betId: aposta.data.bet.id },
      });
      toast.success(res.message);
      aposta.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao sincronizar status");
    } finally {
      setIsSyncing(false);
    }
  };
  
  const isValidated = round?.status === "validated";
  const isClosed = 
    round?.status !== "open" || 
    (round?.closes_at && new Date(round.closes_at) < new Date());
    
  const leagueColors = {
    free: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-200 dark:border-gray-700",
    bronze: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/50",
    prata: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700",
    ouro: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900/50"
  };

  const leagueLabels = {
    free: "Liga Free",
    bronze: "Liga Bronze",
    prata: "Liga Prata",
    ouro: "Liga Ouro"
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Meus Palpites</h1>
              {betLeague && (
                <Badge 
                  variant="outline" 
                  className={`capitalize font-bold px-2 py-0.5 text-[10px] sm:text-xs ${leagueColors[betLeague.type as keyof typeof leagueColors] || leagueColors.free}`}
                >
                  {leagueLabels[betLeague.type as keyof typeof leagueLabels] || betLeague.name}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Histórico de Rodadas</span>
              <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                <SelectTrigger className="w-full sm:w-[280px] bg-background">
                  <SelectValue placeholder="Selecione a rodada" />
                </SelectTrigger>
                <SelectContent>
                  {listaRodadas.data?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title || `Rodada ${r.number}`} 
                      {r.status === 'open' && ' (Aberta)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 sm:text-right">
            {(isClosed || totalPoints > 0) && (
              <div className={`flex flex-col items-end transition-all duration-300 ${isPending ? 'opacity-40 grayscale-[0.8]' : 'opacity-100'}`}>
                <span className="text-xs font-medium uppercase text-muted-foreground">{isValidated ? "Pontuação Final" : "Pontuação Parcial"}</span>
                <span className="text-2xl font-black text-primary">{totalPoints} pts</span>
              </div>
            )}
            <Badge variant={isClosed ? "secondary" : "default"} className="h-fit">
              {isClosed 
                ? (round?.status === "finished" || round?.status === "closed" ? "Rodada encerrada" : "Rodada em andamento") 
                : "Rodada Aberta"}
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
                        <div className={`absolute top-0 right-0 rounded-bl-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${isPending ? 'bg-muted-foreground/30 opacity-50' : (points > 0 ? 'bg-green-600' : 'bg-muted-foreground/50')}`}>
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
                          <div className={`flex items-center gap-1 sm:gap-2 transition-all duration-300 ${isPending ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
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

            {betStatus === "paid" ? (
              <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm font-semibold text-green-700 shadow-sm dark:text-green-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Seu palpite está efetivado e você está participando desta rodada!
              </div>
            ) : isPending ? (
              <div className="flex flex-col gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>Pagamento Pendente: Seu palpite ainda não vale para a premiação.</span>
                  </div>
                  <button 
                    onClick={handleSyncStatus}
                    disabled={isSyncing}
                    className="ml-8 text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSyncing && <Loader2 className="h-3 w-3 animate-spin" />}
                    Já pagou? Sincronizar status agora
                  </button>
                </div>
                <Button 
                  onClick={handleFinishPayment} 
                  disabled={isPaying}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Concluir Pagamento"
                  )}
                </Button>
              </div>
            ) : betLeague?.type === 'free' && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm font-semibold text-primary shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Seu palpite na Liga Free está registrado!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
