import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { getCurrentRound, getMyStatus } from "@/lib/palpite.functions";
import {
  adminBetDetail,
  adminCreateRound,
  adminFetchResults,
  adminOverview,
  adminSaveResults,
  adminSaveMatches,
  adminSetPaid,
    adminSetRoundStatus,
    adminValidateRound,
    adminSearchTeam,
    adminEndSeason,
    adminReopenRound,
    adminDeleteUser,
    adminRemoveParticipantFromRound,
    adminRemoveParticipantFromRanking,
   } from "@/lib/admin.functions";
import { SERIE_A_TEAMS } from "@/lib/constants";
import { SiteHeader } from "@/components/site-header";
import { TeamBadge } from "@/components/team-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Trash2, UserMinus, ListX, Undo2 } from "lucide-react";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Palpite da Rodada" },
      { name: "description", content: "Painel do administrador: participantes, arrecadação e validador." },
      { property: "og:title", content: "Administração — Palpite da Rodada" },
      { property: "og:description", content: "Gerencie a rodada, os pagamentos e os resultados." },
    ],
  }),
  component: Admin,
});

type Modo = "none" | "api" | "manual" | "edit-matches";

function Admin() {
  const status = useQuery({ queryKey: ["meu-status"], queryFn: () => getMyStatus({ data: undefined }) });
  const rodada = useQuery({ queryKey: ["rodada-atual"], queryFn: () => getCurrentRound({ data: {} }) });
  const roundId = rodada.data?.round?.id as string | undefined;

  const overviewFn = useServerFn(adminOverview);
  const detailFn = useServerFn(adminBetDetail);
  const criarRodada = useServerFn(adminCreateRound);
  const salvarPartidas = useServerFn(adminSaveMatches);
  const buscarResultados = useServerFn(adminFetchResults);
  const salvarResultados = useServerFn(adminSaveResults);
  const validar = useServerFn(adminValidateRound);
  const marcarPago = useServerFn(adminSetPaid);
  const mudarStatus = useServerFn(adminSetRoundStatus);
  const buscarEscudo = useServerFn(adminSearchTeam);
  const encerrarTemporadaFn = useServerFn(adminEndSeason);
  const reabrirRodadaFn = useServerFn(adminReopenRound);
  const excluirUsuarioFn = useServerFn(adminDeleteUser);
  const removerDaRodadaFn = useServerFn(adminRemoveParticipantFromRound);
  const removerDoRankingFn = useServerFn(adminRemoveParticipantFromRanking);

  const [activeLeagueType, setActiveLeagueType] = useState<string>("free");

  const overview = useQuery({
    queryKey: ["admin-overview", roundId, activeLeagueType],
    queryFn: () => (roundId ? overviewFn({ data: { roundId, leagueType: activeLeagueType } }) : null),
    enabled: Boolean(roundId) && Boolean(status.data?.isAdmin),
  });

  const [modo, setModo] = useState<Modo>("none");
  const [resultados, setResultados] = useState<Record<string, { home: string; away: string }>>({});
  const [partidasEdit, setPartidasEdit] = useState<
    { id?: string; homeTeam: string; awayTeam: string; homeLogo?: string; awayLogo?: string }[]
  >([]);
  const [betAberta, setBetAberta] = useState<any | null>(null);
  const [picks, setPicks] = useState<any[]>([]);
  const [temporada, setTemporada] = useState(String(new Date().getFullYear()));
  const [numero, setNumero] = useState("1");
  const [ocupado, setOcupado] = useState(false);
  const [dataFechamento, setDataFechamento] = useState("");

  if (status.isLoading) return <Tela>Carregando...</Tela>;
  if (!status.data?.isAdmin) return <Tela>Acesso restrito ao administrador.</Tela>;

  const matches = (rodada.data?.matches ?? []) as any[];
  const stats = overview.data?.stats as any;

  async function acao(fn: () => Promise<unknown>, sucesso: string) {
    setOcupado(true);
    try {
      await fn();
      toast.success(sucesso);
      await Promise.all([rodada.refetch(), overview.refetch()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao executar a ação.");
    } finally {
      setOcupado(false);
    }
  }

  async function abrirAposta(bet: any) {
    setBetAberta(bet);
    try {
      const d = await detailFn({ data: { betId: bet.id } });
      setPicks(d.picks as any[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar palpites.");
    }
  }
  
  function exportarExcel() {
    const data = (overview.data?.participants ?? []).map((p: any) => ({
      Participante: p.full_name,
      Email: p.email,
      Telefone: p.phone,
      Status: p.status === "paid" ? "Prêmio" : "Gratuito",
      Pontos: p.total_points,
      "Data Aposta": p.created_at ? new Date(p.created_at).toLocaleString() : "-",
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, `Participantes_Rodada_${rodada.data?.round?.number}.xlsx`);
  }

  function exportarPDF() {
    const doc = new jsPDF();
    const data = (overview.data?.participants ?? []).map((p: any) => [
      p.full_name,
      p.email,
      p.phone,
      p.status === "paid" ? "Prêmio" : "Gratuito",
      p.total_points.toString(),
    ]);
    
    doc.text(`Participantes - Rodada ${rodada.data?.round?.number}`, 14, 15);
    (doc as any).autoTable({
      head: [["Nome", "Email", "Telefone", "Status", "Pontos"]],
      body: data,
      startY: 20,
    });
    doc.save(`Participantes_Rodada_${rodada.data?.round?.number}.pdf`);
  }

  async function encerrarTemporada() {
    if (!confirm("Tem certeza que deseja encerrar a temporada? Todas as rodadas serão fechadas e um relatório será gerado.")) {
      return;
    }

    setOcupado(true);
    try {
      const res = await encerrarTemporadaFn();
      const ranking = (res as any).ranking || [];
      
      const data = ranking.map((r: any) => ({
        Posição: r.rank,
        Nome: r.full_name,
        Pontos: r.total_points,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório Temporada");
      XLSX.writeFile(wb, `Relatorio_Temporada_${new Date().getFullYear()}.xlsx`);

      toast.success("Temporada encerrada e relatório baixado!");
      await rodada.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao encerrar temporada.");
    } finally {
      setOcupado(false);
    }
  }

  async function excluirUsuario(userId: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Esta ação removerá permanentemente o usuário, seus palpites e pagamentos.`)) {
      return;
    }

    setOcupado(true);
    try {
      await excluirUsuarioFn({ data: { userId } });
      toast.success("Usuário excluído com sucesso.");
      await overview.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao excluir usuário.");
    } finally {
      setOcupado(false);
    }
  }

  async function removerDaRodada(betId: string, nome: string, undo = false) {
    if (
      !undo &&
      !confirm(
        `Remover "${nome}" desta rodada? Ele deixa de contar nesta rodada, mas o ranking geral e o cadastro são mantidos. É possível desfazer.`,
      )
    )
      return;
    setOcupado(true);
    try {
      await removerDaRodadaFn({ data: { betId, undo } });
      toast.success(undo ? "Remoção da rodada desfeita." : "Participante removido da rodada.");
      await overview.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover da rodada.");
    } finally {
      setOcupado(false);
    }
  }

  async function removerDoRanking(userId: string, nome: string, undo = false) {
    if (
      !undo &&
      !confirm(
        `Remover "${nome}" do ranking geral? A participação na rodada atual é mantida e o cadastro também. É possível desfazer.`,
      )
    )
      return;
    setOcupado(true);
    try {
      await removerDoRankingFn({ data: { userId, undo, ...(roundId ? { keepRoundId: roundId } : {}) } });
      toast.success(undo ? "Remoção do ranking desfeita." : "Participante removido do ranking geral.");
      await overview.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover do ranking.");
    } finally {
      setOcupado(false);
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Painel do administrador</h1>
          <Button 
            variant="destructive" 
            disabled={ocupado}
            onClick={encerrarTemporada}
          >
            Encerrar Temporada
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metrica titulo="Arrecadado na Liga" valor={`R$ ${Number(stats?.total_amount ?? 0).toFixed(2)}`} />
          <Metrica
            titulo="Apostadores pagantes"
            valor={`${Number(stats?.paid_count ?? 0)}`}
          />
          <Metrica
            titulo="Situação da rodada"
            valor={
              rodada.data?.round?.status === "open"
                ? (rodada.data?.round?.closes_at && new Date(rodada.data.round.closes_at) < new Date() ? "Fechada (Horário)" : "Aberta")
                : rodada.data?.round?.status === "closed"
                  ? "Rodada em andamento"
                  : rodada.data?.round?.status === "validated"
                    ? "Validada"
                    : "-"
            }
          />
        </div>

        <Tabs defaultValue="free" className="w-full" onValueChange={setActiveLeagueType}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="bronze">Bronze</TabsTrigger>
            <TabsTrigger value="prata">Prata</TabsTrigger>
            <TabsTrigger value="ouro">Ouro</TabsTrigger>
          </TabsList>
        </Tabs>

        {rodada.data?.round?.closes_at && (
          <p className="text-sm text-muted-foreground">
            Encerramento automático em: <strong>{new Date(rodada.data.round.closes_at).toLocaleString()}</strong>
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Rodada</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:w-auto sm:grid-cols-none sm:flex sm:flex-wrap">
              <div className="min-w-0 space-y-1">
                <Label>Temporada</Label>
                <Input className="w-full sm:w-28" value={temporada} onChange={(e) => setTemporada(e.target.value)} />
              </div>
              <div className="min-w-0 space-y-1">
                <Label>Nº da rodada</Label>
                <Input className="w-full sm:w-24" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
                <Label>Fecha em (obrigatório)</Label>
                <Input
                  type="datetime-local"
                  required
                  className="w-full sm:w-52"
                  value={dataFechamento}
                  onChange={(e) => setDataFechamento(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <Button
                disabled={ocupado}
                className="w-full sm:w-auto"
                onClick={() =>
                  acao(
                    () => {
                      if (!dataFechamento) {
                        toast.error("A data de fechamento é obrigatória.");
                        throw new Error("Data de fechamento obrigatória.");
                      }
                      return criarRodada({
                        data: { 
                          season: Number(temporada), 
                          number: Number(numero), 
                          fromApi: true,
                          closesAt: new Date(dataFechamento).toISOString()
                        },
                      });
                    },
                    "Rodada importada da API.",
                  )
                }
              >
                Importar jogos da API
              </Button>
              <Button
                disabled={ocupado}
                className="w-full sm:w-auto"
                onClick={() =>
                  acao(async () => {
                    if (!dataFechamento) {
                      toast.error("A data de fechamento é obrigatória.");
                      throw new Error("Data de fechamento obrigatória.");
                    }
                    const res = await criarRodada({
                      data: { 
                        season: Number(temporada), 
                        number: Number(numero), 
                        fromApi: false,
                        closesAt: new Date(dataFechamento).toISOString()
                      },
                    });
                    setPartidasEdit(
                      Array.from({ length: 10 }).map(() => ({
                        homeTeam: "",
                        awayTeam: "",
                        homeLogo: "",
                        awayLogo: "",
                      })),
                    );
                    setModo("edit-matches");
                    return res;
                  }, "Rodada criada. Agora cadastre os times e escudos abaixo.")
                }
              >
                Criar rodada manual
              </Button>
              {roundId && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={ocupado}
                  onClick={() => {
                    setPartidasEdit(
                      matches.map((m) => ({
                        id: m.id,
                        homeTeam: m.home_team,
                        awayTeam: m.away_team,
                        homeLogo: m.home_logo || "",
                        awayLogo: m.away_logo || "",
                      })),
                    );
                    setModo("edit-matches");
                  }}
                >
                  Editar Times/Escudos
                </Button>
              )}
              {roundId && (
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={ocupado}
                  onClick={() =>
                    acao(
                      () => mudarStatus({ data: { roundId, status: "closed" } }),
                      "Rodada encerrada para novos palpites.",
                    )
                  }
                >
                  Encerrar palpites
                </Button>
              )}
              {roundId && (rodada.data?.round?.status === "closed" || rodada.data?.round?.status === "validated") && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={ocupado}
                  onClick={() =>
                    acao(
                      () => reabrirRodadaFn({ data: { roundId } }),
                      "Rodada reaberta com sucesso!",
                    )
                  }
                >
                  Reabrir Rodada
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {modo === "edit-matches" && roundId && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar Times da Rodada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Informe os nomes e URLs dos escudos para os 10 jogos da rodada.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {partidasEdit.map((p, i) => (
                  <div key={i} className="space-y-3 rounded-lg border border-border p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Jogo {i + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Time Mandante</Label>
                        <Select
                          value={p.homeTeam}
                          onValueChange={async (val) => {
                            const newPartidas = [...partidasEdit];
                            if (newPartidas[i]) newPartidas[i].homeTeam = val;
                            setPartidasEdit(newPartidas);

                            try {
                              const res = await buscarEscudo({ data: { name: val } });
                              if (res?.logo) {
                                setPartidasEdit((prev) => {
                                  const current = [...prev];
                                  if (current[i]) current[i].homeLogo = res.logo;
                                  return current;
                                });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SERIE_A_TEAMS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time Visitante</Label>
                        <Select
                          value={p.awayTeam}
                          onValueChange={async (val) => {
                            const newPartidas = [...partidasEdit];
                            if (newPartidas[i]) newPartidas[i].awayTeam = val;
                            setPartidasEdit(newPartidas);

                            try {
                              const res = await buscarEscudo({ data: { name: val } });
                              if (res?.logo) {
                                setPartidasEdit((prev) => {
                                  const current = [...prev];
                                  if (current[i]) current[i].awayLogo = res.logo;
                                  return current;
                                });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SERIE_A_TEAMS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">URL Escudo Mandante</Label>
                        <Input
                          placeholder="https://..."
                          value={p.homeLogo}
                          onChange={(e) => {
                            const newPartidas = [...partidasEdit];
                            if (newPartidas[i]) newPartidas[i].homeLogo = e.target.value;
                            setPartidasEdit(newPartidas);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL Escudo Visitante</Label>
                        <Input
                          placeholder="https://..."
                          value={p.awayLogo}
                          onChange={(e) => {
                            const newPartidas = [...partidasEdit];
                            if (newPartidas[i]) newPartidas[i].awayLogo = e.target.value;
                            setPartidasEdit(newPartidas);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setModo("none")}>
                  Cancelar
                </Button>
                <Button
                  disabled={ocupado}
                  onClick={() =>
                    acao(async () => {
                      if (!dataFechamento) {
                        toast.error("A data de fechamento é obrigatória.");
                        throw new Error("Data de fechamento obrigatória.");
                      }
                      const valid = partidasEdit.filter((p) => p.homeTeam.trim() && p.awayTeam.trim());
                      if (valid.length === 0) throw new Error("Preencha ao menos um jogo.");
                      await salvarPartidas({ 
                        data: { 
                          roundId: roundId!, 
                          matches: valid as any,
                          closesAt: new Date(dataFechamento).toISOString()
                        } 
                      });
                      setModo("none");
                    }, "Configuração dos times salva com sucesso!")
                  }
                >
                  Salvar Configuração da Rodada
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Participantes</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportarExcel} disabled={!overview.data?.participants?.length}>
                  <Download className="mr-2 h-4 w-4" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportarPDF} disabled={!overview.data?.participants?.length}>
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(overview.data?.participants ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda não há apostas nesta rodada.</p>
            )}
            {(overview.data?.participants ?? []).map((p: any) => (
              <div key={p.id} className="flex w-full items-center gap-2">
                <button
                  onClick={() => abrirAposta(p)}
                  className={`flex flex-1 items-center justify-between rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted ${p.excluded_from_round ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{p.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.email} {p.phone && `· ${p.phone}`}
                    </span>
                    {(p.excluded_from_round || p.excluded_from_ranking) && (
                      <span className="text-xs font-medium text-amber-600">
                        {p.excluded_from_round ? "Removido desta rodada" : ""}
                        {p.excluded_from_round && p.excluded_from_ranking ? " · " : ""}
                        {p.excluded_from_ranking ? "Removido do ranking geral" : ""}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-2">
                    <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                      {p.status === "paid" ? "Prêmio" : "Gratuito"}
                    </Badge>
                    <span className="text-sm font-bold text-primary">{p.total_points} pts</span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={ocupado}
                  onClick={(e) => {
                    e.stopPropagation();
                    excluirUsuario(p.user_id, p.full_name);
                  }}
                  title="Excluir usuário (apaga o cadastro)"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    p.excluded_from_round
                      ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                      : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"
                  }
                  disabled={ocupado}
                  onClick={(e) => {
                    e.stopPropagation();
                    removerDaRodada(p.id, p.full_name, p.excluded_from_round === true);
                  }}
                  title={
                    p.excluded_from_round
                      ? "Desfazer remoção desta rodada"
                      : "Remover desta rodada (não afeta o ranking geral)"
                  }
                >
                  {p.excluded_from_round ? <Undo2 className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    p.excluded_from_ranking
                      ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                      : "text-orange-600 hover:bg-orange-500/10 hover:text-orange-600"
                  }
                  disabled={ocupado}
                  onClick={(e) => {
                    e.stopPropagation();
                    removerDoRanking(p.user_id, p.full_name, p.excluded_from_ranking === true);
                  }}
                  title={
                    p.excluded_from_ranking
                      ? "Desfazer remoção do ranking geral"
                      : "Remover do ranking geral (mantém a participação na rodada)"
                  }
                >
                  {p.excluded_from_ranking ? <Undo2 className="h-4 w-4" /> : <ListX className="h-4 w-4" />}
                </Button>
              </div>
            ))}

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validador da rodada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                disabled={ocupado || !roundId}
                className="w-full sm:w-auto"
                onClick={() =>
                  acao(async () => {
                    await buscarResultados({ data: { roundId: roundId! } });
                    setModo("api");
                  }, "Resultados obtidos da API.")
                }
              >
                Buscar resultados via API
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setModo("manual")} 
                disabled={!roundId}
              >
                Inserir resultados manualmente
              </Button>
            </div>

            <div
              className={
                modo === "none" ? "pointer-events-none space-y-3 opacity-40" : "space-y-3 transition-opacity"
              }
              aria-disabled={modo === "none"}
            >
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_auto_auto_1fr] items-center gap-2 rounded-lg border border-border p-3"
                >
                  <TeamBadge name={m.home_team} logo={m.home_logo} />
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-10 w-12 text-center"
                      inputMode="numeric"
                      value={resultados[m.id]?.home ?? (m.home_score ?? "").toString()}
                      onChange={(e) =>
                        setResultados((r) => ({
                          ...r,
                          [m.id]: {
                            home: e.target.value.replace(/\D/g, "").slice(0, 2),
                            away: r[m.id]?.away ?? (m.away_score ?? "").toString(),
                          },
                        }))
                      }
                      aria-label={`Gols reais do ${m.home_team}`}
                    />
                    <span className="text-muted-foreground">x</span>
                    <Input
                      className="h-10 w-12 text-center"
                      inputMode="numeric"
                      value={resultados[m.id]?.away ?? (m.away_score ?? "").toString()}
                      onChange={(e) =>
                        setResultados((r) => ({
                          ...r,
                          [m.id]: {
                            home: r[m.id]?.home ?? (m.home_score ?? "").toString(),
                            away: e.target.value.replace(/\D/g, "").slice(0, 2),
                          },
                        }))
                      }
                      aria-label={`Gols reais do ${m.away_team}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={ocupado}
                      onClick={() =>
                        acao(() => {
                          const res = resultados[m.id] ?? {
                            home: (m.home_score ?? "").toString(),
                            away: (m.away_score ?? "").toString(),
                          };
                          const home = res.home.trim() === "" ? null : Number(res.home);
                          const away = res.away.trim() === "" ? null : Number(res.away);
                          return salvarResultados({
                            data: { results: [{ matchId: m.id, home, away }] },
                          });
                        }, `Resultado salvo. Placares em branco contam como jogo não realizado.`)
                      }
                    >
                      Salvar
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <TeamBadge name={m.away_team} logo={m.away_logo} position="home" />
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3">
                <p className="w-full text-xs text-muted-foreground">
                  Deixe os dois campos em branco e salve para marcar o jogo como não realizado — ninguém pontua nesse jogo.
                </p>
                <Button
                  disabled={ocupado || !roundId}

                  onClick={() =>
                    acao(
                      () => validar({ data: { roundId: roundId! } }),
                      "Rodada validada e rankings consolidados com sucesso!",
                    )
                  }
                >
                  Validar rodada e consolidar rankings
                </Button>
                
                {rodada.data?.round?.status === "validated" && (
                  <p className="w-full text-xs text-muted-foreground italic">
                    * A rodada já foi validada. O botão de finalização alimenta os rankings geral e premiado.
                  </p>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={Boolean(betAberta)} onOpenChange={(o) => !o && setBetAberta(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Palpites de {betAberta?.full_name}</DialogTitle>
            {betAberta?.phone && (
              <p className="text-xs text-muted-foreground mt-1">WhatsApp: {betAberta.phone}</p>
            )}
          </DialogHeader>
          <div className="space-y-2">
            {picks.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                <span>
                  {p.matches?.home_team} x {p.matches?.away_team}
                </span>
                <span className="font-bold">
                  {p.home_score} x {p.away_score}
                  <span className="ml-2 text-primary">{p.points} pts</span>
                </span>
              </div>
            ))}
            {betAberta && (
              <Button
                variant="outline"
                className="w-full"
                disabled={ocupado}
                onClick={() =>
                  acao(
                    () => marcarPago({ data: { betId: betAberta.id, paid: betAberta.status !== "paid" } }),
                    "Situação do pagamento atualizada.",
                  ).then(() => setBetAberta(null))
                }
              >
                {betAberta.status === "paid" ? "Marcar como não paga" : "Marcar como paga (manual)"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metrica({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="text-2xl font-extrabold text-primary">{valor}</p>
      </CardContent>
    </Card>
  );
}

function Tela({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">{children}</main>
    </div>
  );
}
