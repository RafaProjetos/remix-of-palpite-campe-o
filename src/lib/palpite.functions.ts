import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------------------------- público --------------------------------- */

export const getCurrentRound = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./palpite.server");
  const supabase = publicClient();
  const { data: round } = await supabase
    .from("rounds")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!round) return { round: null, matches: [] as any[], stats: null as any };
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("round_id", round.id)
    .order("position");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: stats } = await supabaseAdmin.rpc("round_stats", { _round_id: round.id });
  return { round, matches: matches ?? [], stats: (stats as any)?.[0] ?? null };
});

export const getRankings = createServerFn({ method: "GET" })
  .inputValidator((d: { roundId?: string | null }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;
    const general = await supabase.rpc("general_ranking");
    let round: any[] = [];
    let paid: any[] = [];
    if (data.roundId) {
      const r = await supabase.rpc("round_ranking", { _round_id: data.roundId });
      round = (r.data as any[]) ?? [];

      // O ranking premiado deve ser alimentado apenas ao final da rodada (status validated)
      const roundData = await supabase.from("rounds").select("status").eq("id", data.roundId).maybeSingle();
      const isRoundValidated = roundData.data?.status === "validated";

      if (isRoundValidated) {
        const { data: paidBets } = await supabase
          .from("bets")
          .select("user_id, total_points, profiles(full_name), status")
          .eq("round_id", data.roundId)
          .eq("status", "paid")
          .order("total_points", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(100);

        paid = (paidBets ?? []).map((b: any) => ({
          user_id: b.user_id,
          full_name: b.profiles?.full_name ?? "Usuário",
          total_points: b.total_points,
          bet_status: b.status
        }));
      } else {
        paid = [];
      }
    }
    return {
      general: (general.data as any[]) ?? [],
      round,
      paid,
    };
  });

export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { ADMIN_EMAIL } = await import("./palpite.server");
  
  // Buscar usuário pelo e-mail
  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  const adminUser = userData?.users.find(u => u.email === ADMIN_EMAIL);

  if (adminUser) {
    // Se existir, garantir que a senha seja #010101
    await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
      password: "#010101"
    });
    
    // Garantir que tenha a role admin
    const { data: role } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", adminUser.id).eq("role", "admin").maybeSingle();
    if (!role) {
      await supabaseAdmin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    }
    
    return { created: false, updated: true };
  }

  // Criar se não existir
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: "#010101",
    email_confirm: true,
    user_metadata: { full_name: "Administrador" },
  });

  if (error || !created.user) {
    return { created: false, error: error?.message ?? "Não foi possível criar o administrador" };
  }
  
  await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
  return { created: true };
});

/* ---------------------------------- usuário --------------------------------- */

export const getMyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let profile = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    
    // Se o perfil não existir, tenta criar
    if (!profile.data) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("*")
        .maybeSingle();
      
      if (!insertError) {
        profile = { data: newProfile, error: null };
      }
    }

    const roles = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return {
      profile: profile.data,
      isAdmin: (roles.data ?? []).some((r: any) => r.role === "admin"),
    };
  });

export const acceptTerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fullName?: string | null; phone?: string | null }) =>
    z.object({ fullName: z.string().trim().max(120).nullable().optional(), phone: z.string().trim().max(30).nullable().optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const update: any = {
      terms_accepted_at: new Date().toISOString(),
    };
    if (data.fullName !== undefined) update.full_name = data.fullName;
    if (data.phone !== undefined) update.phone = data.phone;

    const { error } = await context.supabase
      .from("profiles")
      .update(update)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyBet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string }) => z.object({ roundId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const bet = await context.supabase
      .from("bets")
      .select("*")
      .eq("round_id", data.roundId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!bet.data) return { bet: null, picks: [] as any[] };
    const picks = await context.supabase.from("bet_picks").select("*").eq("bet_id", bet.data.id);
    return { bet: bet.data, picks: picks.data ?? [] };
  });

export const saveBet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string; picks: { matchId: string; home: number; away: number }[] }) =>
    z
      .object({
        roundId: z.string().uuid(),
        picks: z
          .array(
            z.object({
              matchId: z.string().uuid(),
              home: z.number().int().min(0).max(20),
              away: z.number().int().min(0).max(20),
            }),
          )
          .min(1)
          .max(20),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const profile = await supabase.from("profiles").select("terms_accepted_at").eq("id", userId).maybeSingle();
    if (!profile.data?.terms_accepted_at) throw new Error("Aceite o regulamento antes de palpitar.");

    const round = await supabase.from("rounds").select("*").eq("id", data.roundId).maybeSingle();
    if (!round.data) throw new Error("Rodada não encontrada.");
    if (round.data.status !== "open") throw new Error("Esta rodada não está mais aberta para palpites.");
    if (round.data.closes_at && new Date(round.data.closes_at) < new Date()) {
      throw new Error("O prazo para palpites desta rodada já se encerrou.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: stats } = await supabaseAdmin.rpc("round_stats", { _round_id: data.roundId });
    const paid = Number((stats as any)?.[0]?.paid_count ?? 0);

    let bet = (
      await supabase.from("bets").select("*").eq("round_id", data.roundId).eq("user_id", userId).maybeSingle()
    ).data;

    if (bet?.status === "paid") throw new Error("Sua aposta desta rodada já foi paga e não pode ser alterada.");

    if (!bet) {
      const created = await supabase
        .from("bets")
        .insert({ round_id: data.roundId, user_id: userId, amount: round.data.entry_fee, status: "pending" })
        .select("*")
        .single();
      if (created.error) throw new Error(created.error.message);
      bet = created.data;
    }

    const del = await supabase.from("bet_picks").delete().eq("bet_id", bet!.id);
    if (del.error) throw new Error(del.error.message);

    const rows = data.picks.map((p) => ({
      bet_id: bet!.id,
      match_id: p.matchId,
      home_score: p.home,
      away_score: p.away,
    }));
    const ins = await supabase.from("bet_picks").insert(rows);
    if (ins.error) throw new Error(ins.error.message);

    return { betId: bet!.id as string };
  });

export const startPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { betId: string; origin: string }) =>
    z.object({ betId: z.string().uuid(), origin: z.string().url() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const bet = await supabase.from("bets").select("*, rounds(number)").eq("id", data.betId).maybeSingle();
    if (!bet.data || bet.data.user_id !== userId) throw new Error("Aposta não encontrada.");
    if (bet.data.status === "paid") throw new Error("Esta aposta já está paga.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: stats } = await supabaseAdmin.rpc("round_stats", { _round_id: bet.data.round_id });
    const paidCount = Number((stats as any)?.[0]?.paid_count ?? 0);
    const maxPlayers = Number((stats as any)?.[0]?.max_players ?? 100);

    if (paidCount >= maxPlayers) {
      throw new Error("A rodada já atingiu o limite de 100 apostadores pagantes. Tente na próxima rodada.");
    }

    const { createPreference } = await import("./palpite.server");

    const pref = await createPreference({
      betId: bet.data.id,
      amount: Number(bet.data.amount),
      payerEmail: (context.claims as any)?.email ?? "sem-email@palpitedarodada.app",
      roundNumber: (bet.data as any).rounds?.number ?? 0,
      origin: data.origin,
    });

    await supabaseAdmin.from("payments").insert({
      bet_id: bet.data.id,
      user_id: userId,
      preference_id: pref.id,
      status: "pending",
      amount: bet.data.amount,
    });

    return { initPoint: pref.initPoint };
  });
