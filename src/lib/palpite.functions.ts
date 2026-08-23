import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------------------------- público --------------------------------- */

export const getLeagues = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./palpite.server");
  const supabase = publicClient();
  const { data: leagues } = await supabase
    .from("leagues")
    .select("*")
    .order("entry_fee", { ascending: true });
  return leagues ?? [];
});

export const getLeagueStats = createServerFn({ method: "GET" })
  .inputValidator((d: { roundId: string; leagueType: string }) =>
    z.object({ roundId: z.string().uuid(), leagueType: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: stats } = await supabaseAdmin.rpc("league_stats", {
      _round_id: data.roundId,
      _league_type: data.leagueType as any,
    });
    return (stats as any)?.[0] ?? null;
  });

export const getCurrentRound = createServerFn({ method: "GET" })
  .inputValidator((d?: { roundId?: string | null }) =>
    z.object({ roundId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { publicClient } = await import("./palpite.server");
    const supabase = publicClient();
    
    let query = supabase.from("rounds").select("*");
    
    if (data.roundId) {
      query = query.eq("id", data.roundId);
    } else {
      query = query.order("created_at", { ascending: false }).limit(1);
    }

    const { data: round } = await query.maybeSingle();
    
    if (!round) return { round: null, matches: [] as any[] };
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("round_id", round.id)
      .order("position");
    return { round, matches: matches ?? [] };
  });

export const getRounds = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./palpite.server");
  const supabase = publicClient();
  const { data } = await supabase
    .from("rounds")
    .select("id, title, number, status, closes_at")
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getRankings = createServerFn({ method: "GET" })
  .inputValidator((d: { roundId?: string | null; leagueType?: string | null }) =>
    z.object({ roundId: z.string().uuid().nullable().optional(), leagueType: z.string().nullable().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;
    const general = await supabase.rpc("general_ranking");
    let round: any[] = [];
    
    if (data.roundId) {
      const type = data.leagueType || "free";
      const { data: rankingData } = await supabase.rpc("round_league_ranking", {
        _round_id: data.roundId,
        _league_type: type as any,
      });
      round = (rankingData as any[]) ?? [];
    }

    return {
      general: (general.data as any[]) ?? [],
      round,
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
    let profileData = (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data;
    
    // Se o perfil não existir, tenta criar
    if (!profileData) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("*")
        .maybeSingle();
      
      if (!insertError && newProfile) {
        profileData = newProfile;
      }
    }

    const roles = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return {
      profile: profileData,
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
  .inputValidator((d: { roundId: string; leagueId?: string }) => z.object({ roundId: z.string().uuid(), leagueId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("bets")
      .select("*, leagues(*)")
      .eq("round_id", data.roundId)
      .eq("user_id", context.userId);
    
    if (data.leagueId) {
      query = query.eq("league_id", data.leagueId);
    }
    
    const bet = await query.maybeSingle();
    if (!bet.data) return { bet: null, picks: [] as any[] };
    const picks = await context.supabase.from("bet_picks").select("*").eq("bet_id", bet.data.id);
    return { bet: bet.data, picks: picks.data ?? [] };
  });

export const saveBet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roundId: string; leagueId: string; picks: { matchId: string; home: number; away: number }[] }) =>
    z
      .object({
        roundId: z.string().uuid(),
        leagueId: z.string().uuid(),
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

    const league = await supabase.from("leagues").select("*").eq("id", data.leagueId).single();
    if (league.error) throw new Error("Liga não encontrada.");

    let bet = (
      await supabase.from("bets").select("*").eq("round_id", data.roundId).eq("user_id", userId).eq("league_id", data.leagueId).maybeSingle()
    ).data;

    if (bet?.status === "paid") throw new Error("Sua aposta desta liga já foi paga e não pode ser alterada.");

    if (!bet) {
      const created = await supabase
        .from("bets")
        .insert({ 
          round_id: data.roundId, 
          user_id: userId, 
          league_id: data.leagueId,
          amount: league.data.entry_fee, 
          status: league.data.entry_fee > 0 ? "pending" : "paid",
          paid_at: league.data.entry_fee > 0 ? null : new Date().toISOString()
        })
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
    const { data: statsData } = await supabaseAdmin.rpc("round_stats", { _round_id: bet.data.round_id });
    const stats = Array.isArray(statsData) ? statsData[0] : statsData;
    const paidCount = Number(stats?.paid_count ?? 0);
    const maxPlayers = Number(stats?.max_players ?? 100);

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

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      bet_id: bet.data.id,
      user_id: userId,
      preference_id: pref.id,
      status: "pending",
      amount: bet.data.amount,
    });

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
    }

    return { initPoint: pref.initPoint };
  });

export const deleteBet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { betId: string }) => z.object({ betId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    
    const { data: bet, error: fetchError } = await supabase
      .from("bets")
      .select("status, user_id")
      .eq("id", data.betId)
      .single();
      
    if (fetchError || !bet) throw new Error("Aposta não encontrada.");
    if (bet.user_id !== userId) throw new Error("Não autorizado.");
    if (bet.status === "paid") throw new Error("Apostas pagas não podem ser canceladas.");

    const { error: deleteError } = await supabase
      .from("bets")
      .delete()
      .eq("id", data.betId);

    if (deleteError) throw new Error(deleteError.message);
    return { ok: true };
  });

export const syncPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { betId: string }) => z.object({ betId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Garante que a aposta pertence ao usuário antes de reconciliar
    const { data: bet } = await supabase
      .from("bets")
      .select("id, status")
      .eq("id", data.betId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!bet) throw new Error("Aposta não encontrada.");
    if (bet.status === "paid") {
      return { status: "approved", message: "Esta aposta já está confirmada como paga." };
    }

    const { reconcileBetPayments } = await import("./palpite.server");
    return reconcileBetPayments(data.betId);
  });

/**
 * Sincroniza TODAS as apostas pendentes do usuário logado.
 * Usado na página de retorno do pagamento para confirmar automaticamente
 * mesmo quando o webhook do Mercado Pago não chega.
 */
export const syncMyPendingBets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: pendingBets } = await supabase
      .from("bets")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (!pendingBets || pendingBets.length === 0) {
      return { checked: 0, approved: 0 };
    }

    const { reconcileBetPayments } = await import("./palpite.server");

    let approved = 0;
    for (const bet of pendingBets) {
      try {
        const result = await reconcileBetPayments(bet.id);
        if (result.status === "approved") approved++;
      } catch (e) {
        console.error("syncMyPendingBets: erro ao reconciliar aposta", bet.id, e);
      }
    }

    return { checked: pendingBets.length, approved };
  });
