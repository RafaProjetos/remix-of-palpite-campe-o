import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound, getRankings } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, MessageCircle } from "lucide-react";

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
  loader: () => getCurrentRound({ data: {} }),
  component: Home,
});

const LEAGUE_TABS = [
  { value: "free", label: "Free" },
  { value: "bronze", label: "Bronze" },
  { value: "prata", label: "Prata" },
  { value: "ouro", label: "Ouro" },
];

function LeagueRankingList({ roundId, leagueType }: { roundId: string | null; leagueType: string }) {
  const ranking = useQuery({
    queryKey: ["home-ranking", roundId, leagueType],
    queryFn: () => getRankings({ data: { roundId, leagueType } }),
    enabled: !!roundId,
  });

  const rows = ranking.data?.round ?? [];

  if (!roundId || rows.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground italic">Aguardando os primeiros palpites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((r: any, i: number) => (
        <div key={r.user_id} className="group flex items-center justify-between rounded-xl bg-muted/50 p-4 transition-all hover:bg-muted">
          <div className="flex items-center gap-3">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-muted-foreground/20'
            }`}>
              {i + 1}
            </span>
            <span className="text-sm font-bold truncate max-w-[120px]">
              {r.full_name}
            </span>
          </div>
          <Badge variant="secondary" className="font-black text-primary">
            {r.total_points} pts
          </Badge>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const { round, matches } = Route.useLoaderData();

  const closesAt = round?.closes_at ? new Date(round.closes_at) : null;
  const isClosed = !!(round?.status !== "open" || (closesAt && closesAt < new Date()));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary via-primary to-secondary py-16 text-primary-foreground sm:py-24">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 border-accent/50 bg-accent/10 text-accent-foreground px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
              Brasileirão Série A 2026
            </Badge>
            <h1 className="max-w-4xl font-logo text-2xl leading-tight tracking-tight sm:text-6xl md:text-7xl">
              Transforme seus palpites em <span className="text-accent underline decoration-accent/30 underline-offset-8">prêmios reais</span>.
            </h1>
            <p className="mt-8 max-w-2xl text-base text-primary-foreground/90 sm:text-xl leading-relaxed">
              Participe do maior bolão do futebol brasileiro. Escolha sua liga, crave os placares e dispute o topo do ranking com milhares de torcedores apaixonados.
            </p>
            <div className="mt-10 flex flex-col w-full gap-4 sm:flex-row sm:w-auto">
              <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-accent/20 transition-all hover:scale-105 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/palpitar">Começar a Palpitar Agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white/40 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
                <Link to="/regulamento">Ver Ligas e Prêmios</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="container mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-3">

        {/* Round Games */}
        <Card className="lg:col-span-2 border-none shadow-xl">
          <CardHeader className="flex flex-col space-y-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Próximos Jogos</p>
              <CardTitle className="text-xl font-extrabold sm:text-3xl">
                {round ? round.title || `Rodada ${round.number}` : "Aguardando rodada..."}
              </CardTitle>
            </div>
            {round && (
              <Badge variant={!isClosed ? "default" : "secondary"} className="w-fit px-4 py-1 text-sm font-bold">
                {!isClosed
                  ? "Aberto para Palpites"
                  : round.status === "validated"
                    ? "Rodada encerrada"
                    : "Rodada em andamento"}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {matches.length === 0 && (
                <div className="p-8 text-center col-span-2">
                  <p className="text-muted-foreground">Os jogos desta rodada serão publicados em breve.</p>
                </div>
              )}
              {matches.map((m: any, i: number) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-4 sm:p-6 transition-colors hover:bg-muted/30 ${
                    i % 2 === 0 ? 'md:border-r' : ''
                  } ${i < matches.length - 2 ? 'border-b' : (i < matches.length - 1 ? 'border-b md:border-b-0' : '')}`}
                >
                  <div className="flex flex-col items-center gap-2 flex-[1.5] min-w-0">
                    <TeamBadge
                      name={m.home_team}
                      logo={m.home_logo}
                      position="home"
                      size="md"
                      layout="vertical"
                      hideNameOnMobile={true}
                    />
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary mb-1 whitespace-nowrap">
                      {m.home_score !== null && m.away_score !== null
                        ? `${m.home_score} x ${m.away_score}`
                        : "VS"}
                    </span>
                    {m.kickoff_at && (
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">
                        {new Date(m.kickoff_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-[1.5] min-w-0">
                    <TeamBadge
                      name={m.away_team}
                      logo={m.away_logo}
                      position="away"
                      size="md"
                      layout="vertical"
                      hideNameOnMobile={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-6 border-t bg-muted/10">
            <Button asChild className="w-full h-12 font-bold text-lg" size="lg">
              <Link to="/palpitar">Faça seus palpites Gratuitos Agora</Link>
            </Button>
          </div>
        </Card>

        {/* Sidebar: Ranking & Security */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-xl">Ranking da Rodada</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="free">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  {LEAGUE_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value} className="text-xs font-bold">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {LEAGUE_TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value}>
                    <LeagueRankingList roundId={round?.id ?? null} leagueType={t.value} />
                  </TabsContent>
                ))}
              </Tabs>
              <Button asChild variant="ghost" className="mt-2 w-full font-bold group">
                <Link to="/ranking" className="flex items-center justify-center gap-2">
                  Ver Ranking Completo
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Security & Partners */}
          <Card className="border-none shadow-lg bg-card/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Aposta Segura</p>
                  <p className="text-[10px]">Proteção LGPD e Transparência total</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Checkout Seguro</p>
                  <p className="text-[10px]">Parceiro oficial Mercado Pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* League Overview (Vitrine) */}
        <div className="lg:col-span-3 mt-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">Escolha sua Liga</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Liga Free */}
            <Card className="relative flex flex-col border-2 border-slate-200 transition-all duration-300 hover:border-primary hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/20 dark:border-slate-800">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-slate-500 hover:bg-slate-600">Free</Badge>
                <CardTitle className="text-2xl font-bold">Treinamento</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground mb-6">Diversão garantida e disputa no ranking global sem custos.</p>
                <div className="mt-auto space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> <span>Ranking Global</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> <span>Sem custos</span></div>
                </div>
                <div className="text-3xl font-black mb-6">Grátis</div>
                <Button asChild variant="outline" className="w-full mt-auto font-bold"><Link to="/palpitar">Jogar Agora</Link></Button>
              </CardContent>
            </Card>

            {/* Liga Bronze */}
            <Card className="relative flex flex-col border-2 border-orange-200 transition-all duration-300 hover:border-orange-400 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl dark:border-orange-900/30">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-orange-600 hover:bg-orange-700 text-white border-none px-3 py-1 shadow-md uppercase text-[10px] font-black tracking-wider">Mais Popular</Badge>
              </div>
              <CardHeader>
                <Badge className="w-fit mb-2 bg-orange-700 hover:bg-orange-800">Bronze</Badge>
                <CardTitle className="text-2xl font-bold">Iniciante</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground mb-6">Entrada acessível para quem quer começar a ganhar prêmios reais.</p>
                <div className="mt-auto space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-orange-600" /> <span>Prêmios Reais</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-orange-600" /> <span>Baixo Custo</span></div>
                </div>
                <div className="text-3xl font-black mb-6">R$ 5,00</div>
                <Button asChild className="w-full mt-auto font-bold bg-orange-700 hover:bg-orange-800 text-white"><Link to="/palpitar">Participar</Link></Button>
              </CardContent>
            </Card>

            {/* Liga Prata */}
            <Card className="relative flex flex-col border-2 border-slate-300 transition-all duration-300 hover:border-slate-400 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl dark:border-slate-700">
              <CardHeader>
                <Badge className="w-fit mb-2 bg-slate-400 hover:bg-slate-500 text-black">Prata</Badge>
                <CardTitle className="text-2xl font-bold">Competitivo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground mb-6">O equilíbrio ideal entre risco e recompensa para apostadores médios.</p>
                <div className="mt-auto space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-slate-500" /> <span>Pote Médio</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-slate-500" /> <span>Ranking Segmentado</span></div>
                </div>
                <div className="text-3xl font-black mb-6">R$ 20,00</div>
                <Button asChild className="w-full mt-auto font-bold bg-slate-500 hover:bg-slate-600 text-white"><Link to="/palpitar">Participar</Link></Button>
              </CardContent>
            </Card>

            {/* Liga Ouro */}
            <Card className="relative flex flex-col border-2 border-yellow-400 shadow-xl shadow-yellow-500/10 transition-all hover:scale-[1.02] hover:shadow-yellow-500/20 bg-gradient-to-b from-card to-yellow-500/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black border-none px-3 py-1 shadow-md uppercase text-[10px] font-black tracking-wider">Mais Vantajoso</Badge>
              </div>
              <CardHeader>
                <Badge className="w-fit mb-2 bg-yellow-500 text-black hover:bg-yellow-600">Ouro</Badge>
                <CardTitle className="text-2xl font-bold">Elite</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground mb-6">Para os especialistas. Pote exclusivo e premiação máxima no Top 10.</p>
                <div className="mt-auto space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-yellow-600" /> <span>Maior Pote</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-yellow-600" /> <span>Prêmio Top 10</span></div>
                </div>
                <div className="text-3xl font-black mb-6">R$ 50,00</div>
                <Button asChild className="w-full mt-auto font-bold bg-yellow-500 hover:bg-yellow-600 text-black"><Link to="/palpitar">Ser Elite</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* WhatsApp Community CTA */}
      <section className="py-16 bg-muted/50 border-y border-border">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                    <MessageCircle className="h-4 w-4 fill-white text-green-600" />
                    Comunidade Exclusiva
                  </div>
                  <h2 className="text-3xl font-black sm:text-4xl">Entre no Grupo do WhatsApp</h2>
                  <p className="text-lg text-green-50/90 max-w-xl font-medium leading-relaxed">
                    Receba atualizações das rodadas, dicas exclusivas e participe das resenhas com outros apostadores em tempo real.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    asChild
                    size="lg"
                    className="h-16 px-10 text-xl font-black bg-white text-green-700 hover:bg-green-50 shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <a
                      href="https://chat.whatsapp.com/GjkXVgHQlfILoRHfucEHcC?s=cl&p=a&mlu=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3"
                    >
                      Acessar Grupo
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <footer className="mt-auto border-t py-12 bg-card">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-extrabold mb-4">Pronto para liderar o ranking?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Não fique de fora da próxima rodada. Garanta seu lugar e concorra a prêmios em dinheiro.</p>
          <Button asChild size="lg" className="px-12 font-bold h-14 text-lg">
            <Link to="/palpitar">Quero fazer meu palpite</Link>
          </Button>
          <div className="mt-12 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-4">
            <p>© 2026 Palpite da Rodada. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link to="/regulamento" className="hover:text-primary underline">Regulamento</Link>
              <Link to="/regulamento" className="hover:text-primary underline">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
