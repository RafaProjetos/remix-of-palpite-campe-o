import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito ao administrador.");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string; leagueType?: string }) => z.object({ roundId: z.string().uuid(), leagueType: z.string().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let leagueId: string | undefined;
    if (data.leagueType) {
      const { data: league } = await supabase.from("leagues").select("id").eq("type", data.leagueType as any).maybeSingle();
      leagueId = league?.id;
    }

    let query = supabase
      .from("bets")
      .select("id, user_id, status, amount, total_points, full_hits, winner_hits, created_at, paid_at")
      .eq("round_id", data.roundId)
      .order("total_points", { ascending: false })
      .order("full_hits", { ascending: false })
      .order("winner_hits", { ascending: false })
      .order("created_at", { ascending: true });

    if (leagueId) {
      query = query.eq("league_id", leagueId);
    }

    const bets = await query;
    const profiles = await supabase.from("profiles").select("id, full_name, email, phone");
    const { data: stats } = await supabaseAdmin.rpc("league_stats", { 
      _round_id: data.roundId,
      _league_type: (data.leagueType || 'ouro') as "free" | "bronze" | "prata" | "ouro"
    });
    
    const byId = new Map((profiles.data ?? []).map((p: any) => [p.id, p]));
    return {
      participants: (bets.data ?? []).map((b: any) => ({
        ...b,
        full_name: byId.get(b.user_id)?.full_name ?? "Apostador",
        email: byId.get(b.user_id)?.email ?? "",
        phone: byId.get(b.user_id)?.phone ?? "",
      })),
      stats: (stats as any)?.[0] ?? null,
    };
  });

export const adminBetDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { betId: string }) => z.object({ betId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const picks = await context.supabase
      .from("bet_picks")
      .select("*, matches(home_team, away_team, home_logo, away_logo, position, home_score, away_score)")
      .eq("bet_id", data.betId);
    const list = (picks.data ?? []).sort(
      (a: any, b: any) => (a.matches?.position ?? 0) - (b.matches?.position ?? 0),
    );
    return { picks: list };
  });

export const adminSetPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { betId: string; paid: boolean }) =>
    z.object({ betId: z.string().uuid(), paid: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("bets")
      .update({ status: data.paid ? "paid" : "pending", paid_at: data.paid ? new Date().toISOString() : null })
      .eq("id", data.betId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { season: number; number: number; fromApi: boolean; closesAt: string }) =>
    z
      .object({
        season: z.number().int().min(2020).max(2100),
        number: z.number().int().min(1).max(38),
        fromApi: z.boolean(),
        closesAt: z.string().datetime(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin
      .from("rounds")
      .select("id")
      .eq("season", data.season)
      .eq("number", data.number)
      .maybeSingle();

    let roundId = existing.data?.id as string | undefined;
    if (!roundId) {
      const created = await supabaseAdmin
        .from("rounds")
        .insert({
          season: data.season,
          number: data.number,
          title: `Rodada ${data.number} - Brasileirão ${data.season}`,
          status: "open",
          closes_at: data.closesAt,
        })
        .select("id")
        .single();
      if (created.error) throw new Error(created.error.message);
      roundId = created.data.id;
    }

    if (data.fromApi) {
      const { fetchFixtures } = await import("./palpite.server");
      const fixtures = await fetchFixtures(data.season, data.number);
      if (fixtures.length === 0) throw new Error("A API não retornou jogos para esta rodada.");
      await supabaseAdmin.from("matches").delete().eq("round_id", roundId);
      const rows = fixtures.map((f, i) => ({
        round_id: roundId,
        position: i + 1,
        external_id: f.externalId,
        home_team: f.homeTeam,
        home_logo: f.homeLogo,
        away_team: f.awayTeam,
        away_logo: f.awayLogo,
        kickoff_at: f.kickoffAt,
      }));
      const ins = await supabaseAdmin.from("matches").insert(rows);
      if (ins.error) throw new Error(ins.error.message);
    }

    return { roundId };
  });

export const adminSaveMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      roundId: string;
      closesAt: string;
      matches: { id?: string; homeTeam: string; awayTeam: string; homeLogo?: string; awayLogo?: string }[];
    }) =>
      z
        .object({
          roundId: z.string().uuid(),
          closesAt: z.string().datetime(),
          matches: z
            .array(
              z.object({
                id: z.string().uuid().optional(),
                homeTeam: z.string().trim().min(2).max(60),
                awayTeam: z.string().trim().min(2).max(60),
                homeLogo: z.string().trim().max(500).optional(),
                awayLogo: z.string().trim().max(500).optional(),
              }),
            )
            .min(1)
            .max(20),
        })
        .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("rounds").update({ closes_at: data.closesAt }).eq("id", data.roundId);
    await supabaseAdmin.from("matches").delete().eq("round_id", data.roundId);
    const rows = data.matches.map((m, i) => ({
      round_id: data.roundId,
      position: i + 1,
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      home_logo: m.homeLogo || null,
      away_logo: m.awayLogo || null,
    }));
    const ins = await supabaseAdmin.from("matches").insert(rows);
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true };
  });

export const adminFetchResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string }) => z.object({ roundId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchFixtureById } = await import("./palpite.server");
    const matches = await supabaseAdmin.from("matches").select("*").eq("round_id", data.roundId);
    let updated = 0;
    for (const m of matches.data ?? []) {
      if (!m.external_id) continue;
      const fx = await fetchFixtureById(m.external_id);
      if (fx && fx.homeScore !== null && fx.awayScore !== null) {
        await supabaseAdmin
          .from("matches")
          .update({ home_score: fx.homeScore, away_score: fx.awayScore })
          .eq("id", m.id);
        updated += 1;
      }
    }
    if (updated === 0) {
      throw new Error("Nenhum resultado disponível na API. Use a inserção manual dos placares.");
    }
    if (updated > 0) {
      await supabaseAdmin.rpc("recalculate_partial_scores", { _round_id: data.roundId });
    }
    return { updated };
  });

export const adminSaveResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { results: { matchId: string; home: number | null; away: number | null }[] }) =>
    z
      .object({
        results: z
          .array(
            z.object({
              matchId: z.string().uuid(),
              home: z.number().int().min(0).max(30).nullable(),
              away: z.number().int().min(0).max(30).nullable(),
            }),
          )
          .min(1)
          .max(20),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const r of data.results) {
      // Placar em branco = jogo ainda não realizado: zera o resultado e não pontua ninguém
      const home = r.home === null || r.away === null ? null : r.home;
      const away = r.home === null || r.away === null ? null : r.away;
      await supabaseAdmin
        .from("matches")
        .update({ home_score: home, away_score: away })
        .eq("id", r.matchId);
    }


    // Recalcula pontuações parciais em tempo real após salvar resultados
    const roundRes = await supabaseAdmin
      .from("matches")
      .select("round_id")
      .in("id", data.results.map(r => r.matchId))
      .limit(1)
      .maybeSingle();

    if (roundRes.data?.round_id) {
      await supabaseAdmin.rpc("recalculate_partial_scores", { _round_id: roundRes.data.round_id });
    }

    return { ok: true };
  });

export const adminValidateRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string }) => z.object({ roundId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("validate_round", { _round_id: data.roundId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetRoundStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string; status: "open" | "closed" | "validated" }) =>
    z.object({ roundId: z.string().uuid(), status: z.enum(["open", "closed", "validated"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("rounds")
      .update({ status: data.status })
      .eq("id", data.roundId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSearchTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().min(3) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { searchTeam } = await import("./palpite.server");
    return searchTeam(data.name);
  });

export const adminEndSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fecha todas as rodadas
    const { error: updateError } = await supabaseAdmin
      .from("rounds")
      .update({ status: "closed" })
      .neq("status", "closed");

    if (updateError) throw new Error(updateError.message);

    // Busca ranking geral para o relatório
    const { data: ranking, error: rankingError } = await supabaseAdmin.rpc("general_ranking");
    if (rankingError) throw new Error(rankingError.message);

    return { ranking };
  });

export const adminReopenRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string }) => z.object({ roundId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("rounds")
      .update({ status: "open" })
      .eq("id", data.roundId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
