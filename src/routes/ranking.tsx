import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getRankings, getLeagues } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Trophy, Users, Clock } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Palpite da Rodada" },
      {
        name: "description",
        content: "Acompanhe em tempo real o ranking da rodada com critérios de desempate detalhados.",
      },
      { property: "og:title", content: "Ranking — Palpite da Rodada" },
      { property: "og:description", content: "Ranking da rodada e ranking geral acumulado do bolão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  const [activeLeagueType, setActiveLeagueType] = useState<string>("free");
  const meQuery = useQuery({
    queryKey: ["me-ranking"],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });
  const myUserId = meQuery.data ?? null;
  const currentRoundQuery = useQuery({
    queryKey: ["current-round", "ranking"],
    queryFn: () => getCurrentRound({ data: {} }),
    retry: 2,
  });
  const round = currentRoundQuery.data?.round;
  
  const leaguesQuery = useQuery({
    queryKey: ["leagues"],
    queryFn: () => getLeagues({}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["rankings", round?.id, activeLeagueType],
    queryFn: () => getRankings({ data: { roundId: round?.id ?? null, leagueType: activeLeagueType } }),
    enabled: currentRoundQuery.isSuccess,
    retry: 2,
    refetchInterval: 30_000,
  });

  const activeLeague = leaguesQuery.data?.find(l => l.type === activeLeagueType);

  const roundRows: any[] = data?.round ?? [];
  const topRows = roundRows.slice(0, 10);
  const myRow = myUserId ? roundRows.find((r: any) => r.user_id === myUserId) : null;
  const myRowOutsideTop = myRow && !topRows.some((r: any) => r.user_id === myUserId) ? myRow : null;
  const nomeDe = (r: any) => r.full_name || r.display_name || "Participante";


  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-10">
        <header className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Classificação da Rodada</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Transparência total nos resultados e critérios de desempate automáticos.
          </p>
        </header>

        {currentRoundQuery.isError && (
          <div className="flex items-center gap-3 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Não foi possível carregar a rodada agora. Tente novamente em instantes.</span>
          </div>
        )}

        <Tabs defaultValue="free" className="w-full" onValueChange={setActiveLeagueType}>
          <TabsList className="grid w-full grid-cols-4 h-12 mb-8">
            <TabsTrigger value="free" className="text-xs sm:text-sm">Free</TabsTrigger>
            <TabsTrigger value="bronze" className="text-xs sm:text-sm text-amber-700">Bronze</TabsTrigger>
            <TabsTrigger value="prata" className="text-xs sm:text-sm text-slate-500">Prata</TabsTrigger>
            <TabsTrigger value="ouro" className="text-xs sm:text-sm text-yellow-600">Ouro</TabsTrigger>
          </TabsList>

          <TabsContent value={activeLeagueType} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className={`h-5 w-5 ${activeLeagueType === 'free' ? 'text-blue-500' : 'text-yellow-500'}`} />
                    {activeLeague?.name || "Liga"} - Rodada {round?.number ?? ""}
                  </CardTitle>
                  <CardDescription>
                    Critérios: Pontos {" > "} Placares {" > "} Vencedor {" > "} Data {" > "} Nome
                  </CardDescription>
                </div>
                {activeLeagueType !== 'free' && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600/20 bg-yellow-600/5">
                    Liga Premiada
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] text-center">Pos</TableHead>
                        <TableHead>Participante</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Placares</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Venc.</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Envio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">Carregando ranking...</TableCell>
                        </TableRow>
                      ) : roundRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            Nenhum participante nesta liga ainda.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...topRows, ...(myRowOutsideTop ? [myRowOutsideTop] : [])].map((r: any) => (
                          <TableRow
                            key={r.user_id}
                            className={
                              r.user_id === myUserId
                                ? "bg-primary/10 ring-1 ring-primary/30"
                                : r.row_position <= 10 && activeLeagueType !== "free"
                                  ? "bg-yellow-500/5"
                                  : ""
                            }
                          >
                            <TableCell className="text-center font-bold">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] ${
                                r.row_position === 1 ? "bg-yellow-500 text-yellow-950" : 
                                r.row_position <= 3 ? "bg-slate-200 text-slate-800" : 
                                "bg-muted text-muted-foreground"
                              }`}>
                                {r.row_position}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate text-xs sm:text-sm">
                                  {nomeDe(r)}
                                  {r.user_id === myUserId && (
                                    <span className="ml-2 text-[9px] uppercase font-bold text-primary">Você</span>
                                  )}
                                </span>
                                {r.row_position <= 10 && activeLeagueType !== 'free' && (
                                  <span className="text-[8px] sm:text-[10px] text-yellow-600 font-bold uppercase tracking-tighter">Zona de Premiação</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-primary text-xs sm:text-base">{r.total_points}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell">{r.full_hits}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell">{r.winner_hits}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground hidden md:table-cell">
                              <div className="flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Ranking Geral Acumulado
                </CardTitle>
                <CardDescription>Soma de pontos de todas as rodadas finalizadas.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] text-center">Pos</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead className="text-right">Total Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.general ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Ainda não há dados acumulados.</TableCell>
                      </TableRow>
                    ) : (
                      (data?.general ?? []).map((r: any, i: number) => (
                        <TableRow key={r.user_id}>
                          <TableCell className="text-center font-medium">{i + 1}</TableCell>
                          <TableCell>{r.display_name}</TableCell>
                          <TableCell className="text-right font-bold">{r.total_points} pts</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
