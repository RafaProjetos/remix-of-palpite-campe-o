import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getRankings } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Star } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Palpite da Rodada" },
      {
        name: "description",
        content: "Acompanhe em tempo real o ranking da rodada e o ranking geral do bolão do Brasileirão.",
      },
      { property: "og:title", content: "Ranking — Palpite da Rodada" },
      { property: "og:description", content: "Ranking da rodada e ranking geral acumulado do bolão." },
    ],
  }),
  loader: () => getCurrentRound(),
  component: RankingPage,
});

function RankingPage() {
  const { round } = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["rankings", round?.id ?? null],
    queryFn: () => getRankings({ data: { roundId: round?.id ?? null } }),
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:py-10">
        <header className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Rankings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe a classificação da rodada e o ranking geral.
          </p>
        </header>

        <Tabs defaultValue="round" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="paid" className="gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="hidden sm:inline">Ranking Premiado</span>
              <span className="sm:hidden">Premiado</span>
            </TabsTrigger>
            <TabsTrigger value="round" className="gap-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span className="hidden sm:inline">Rodada {round?.number ?? ""}</span>
              <span className="sm:hidden">Rodada</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">Ranking Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paid" className="space-y-4">
            <Card className="border-yellow-500/20 shadow-lg shadow-yellow-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle>TOP 5 — Premiação em Dinheiro</CardTitle>
                </div>
                <CardDescription>
                  Disponível apenas após a validação final da rodada pelo administrador.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-3 sm:p-6">
                {(data?.paid ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Ainda não há participantes confirmados no modo prêmio para esta rodada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(data?.paid ?? []).slice(0, 5).map((r: any, i: number) => (
                      <Row 
                        key={r.user_id} 
                        pos={i + 1} 
                        name={r.full_name} 
                        points={r.total_points} 
                        isPaid
                      />
                    ))}
                    {(data?.paid ?? []).length > 5 && (
                      <div className="pt-4 mt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                          Demais Participantes (Modo Prêmio)
                        </p>
                        <div className="space-y-2">
                          {(data?.paid ?? []).slice(5).map((r: any, i: number) => (
                            <Row 
                              key={r.user_id} 
                              pos={i + 6} 
                              name={r.full_name} 
                              points={r.total_points} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="round">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  <CardTitle>Classificação da Rodada {round?.number ?? "-"}</CardTitle>
                </div>
                <CardDescription>
                  Ranking incluindo todos os participantes (Gratuito e Prêmio). A pontuação é atualizada em tempo real.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6">
                {(data?.round ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Ainda sem pontuação nesta rodada.
                  </p>
                ) : (
                  (data?.round ?? []).map((r: any, i: number) => (
                    <Row key={r.user_id} pos={i + 1} name={r.full_name} points={r.total_points} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <CardTitle>Ranking Geral Acumulado</CardTitle>
                </div>
                <CardDescription>
                  Pontuação acumulada de todas as rodadas finalizadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6">
                {(data?.general ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Ninguém pontuou ainda no ranking geral.
                  </p>
                ) : (
                  (data?.general ?? []).map((r: any, i: number) => (
                    <Row
                      key={r.user_id}
                      pos={i + 1}
                      name={r.full_name}
                      points={r.total_points}
                      extra={`${r.rounds_played} rodada(s)`}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Row({
  pos,
  name,
  points,
  extra,
  isPaid,
}: {
  pos: number;
  name: string;
  points: number;
  extra?: string;
  isPaid?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-3 sm:px-4 ${
      isPaid && pos <= 5 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted"
    }`}>
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:h-7 sm:w-7 sm:text-xs ${
            pos === 1 && isPaid ? "bg-yellow-500 text-yellow-950" : 
            pos === 1 ? "bg-accent text-accent-foreground" : 
            "bg-card text-foreground border border-border"
          }`}
        >
          {pos}
        </span>
        <span className="truncate">{name}</span>
        {isPaid && pos <= 5 && (
          <Trophy className="h-3 w-3 text-yellow-500 shrink-0" />
        )}
        {extra && (
          <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline sm:text-xs">
            ({extra})
          </span>
        )}
      </span>
      <span className="ml-2 shrink-0 text-sm font-bold text-primary">{points} pts</span>
    </div>
  );
}