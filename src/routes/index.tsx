import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getRankings } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palpite da Rodada — Bolão do Brasileirão" },
      {
        name: "description",
        content:
          "Palpite nos 10 jogos da rodada do Campeonato Brasileiro, pague R$ 50 e dispute o ranking da rodada e o ranking geral.",
      },
      { property: "og:title", content: "Palpite da Rodada — Bolão do Brasileirão" },
      {
        property: "og:description",
        content: "Bolão da rodada do Brasileirão: 10 jogos, R$ 50 por aposta, ranking em tempo real.",
      },
    ],
  }),
  loader: () => getCurrentRound(),
  component: Home,
});

function Home() {
  const { round, matches, stats } = Route.useLoaderData();
  const ranking = useQuery({
    queryKey: ["rankings", round?.id ?? null],
    queryFn: () => getRankings({ data: { roundId: round?.id ?? null } }),
  });

  const pagos = Number(stats?.paid_count ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <p className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground sm:text-xs">
            Brasileirão Série A
          </p>
          <h1 className="max-w-2xl font-logo text-3xl leading-tight tracking-tight sm:text-5xl">
            Acertou o placar? Você lidera a rodada.
          </h1>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/90 sm:text-lg">
            Dê o seu palpite nos 10 jogos da rodada, pague R$ 50 e concorra ao prêmio da rodada e ao ranking
            geral da competição. Apenas 100 apostadores por rodada.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
              <Link to="/palpitar">Fazer meu palpite</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-white/40 bg-transparent sm:w-auto">
              <Link to="/regulamento">Ver regulamento</Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:gap-10">
            <div>
              <p className="text-2xl font-bold sm:text-3xl">{pagos}/100</p>
              <p className="text-xs text-primary-foreground/80 sm:text-sm">apostadores pagantes</p>
            </div>
            <div>
              <p className="text-2xl font-bold sm:text-3xl">R$ 50</p>
              <p className="text-xs text-primary-foreground/80 sm:text-sm">por rodada</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold sm:text-3xl">30 pts</p>
              <p className="text-xs text-primary-foreground/80 sm:text-sm">por placar exato</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3 sm:py-10">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-xl sm:text-2xl">
              {round ? round.title || `Rodada ${round.number}` : "Nenhuma rodada disponível ainda"}
            </CardTitle>
            {round && (
              <Badge variant={round.status === "open" ? "default" : "secondary"} className="w-fit">
                {round.status === "open" ? "Aberta" : round.status === "closed" ? "Encerrada" : "Validada"}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 p-3 sm:p-6">
            {matches.length === 0 && (
              <p className="text-sm text-muted-foreground">
                O administrador ainda não publicou os jogos da rodada.
              </p>
            )}
            {matches.map((m: any) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border bg-card p-2 sm:gap-3 sm:p-3"
              >
                <div className="flex justify-end overflow-hidden">
                  <TeamBadge name={m.home_team} logo={m.home_logo} position="home" className="text-xs sm:text-sm" />
                </div>
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold sm:px-3 sm:text-sm">
                  {m.home_score !== null && m.away_score !== null
                    ? `${m.home_score} x ${m.away_score}`
                    : "x"}
                </span>
                <div className="flex justify-start overflow-hidden">
                  <TeamBadge name={m.away_team} logo={m.away_logo} position="away" className="text-xs sm:text-sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking da rodada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(ranking.data?.round ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda sem pontuação para esta rodada.</p>
            )}
            {(ranking.data?.round ?? []).slice(0, 10).map((r: any, i: number) => (
              <div key={r.user_id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm font-medium">
                  {i + 1}. {r.full_name}
                </span>
                <span className="text-sm font-bold text-primary">{r.total_points} pts</span>
              </div>
            ))}
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to="/ranking">Ver ranking completo</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
