import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const ENTRY_FEE = 50;
export const MAX_PLAYERS = 100;
export const ADMIN_EMAIL = "adm@palpitedarodada.app";
export const BRASILEIRAO_LEAGUE_ID = 71;

export function publicClient(): SupabaseClient {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ApiFootballFixture = {
  externalId: string;
  homeTeam: string;
  homeLogo: string | null;
  awayTeam: string;
  awayLogo: string | null;
  kickoffAt: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
};

async function apiFootball(path: string): Promise<any> {
  const key = process.env["API_FOOTBALL_KEY"];
  if (!key) {
    throw new Error(
      "A chave da API-Football não está configurada. Cadastre os jogos manualmente ou peça a configuração da chave.",
    );
  }
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { "x-apisports-key": key },
  });
  if (!res.ok) {
    throw new Error(`API-Football respondeu ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as any;
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

export async function fetchFixtures(season: number, round: number): Promise<ApiFootballFixture[]> {
  const json = await apiFootball(
    `/fixtures?league=${BRASILEIRAO_LEAGUE_ID}&season=${season}&round=${encodeURIComponent(
      `Regular Season - ${round}`,
    )}`,
  );
  const list: any[] = json.response ?? [];
  return list.map((f) => ({
    externalId: String(f.fixture?.id ?? ""),
    homeTeam: f.teams?.home?.name ?? "",
    homeLogo: f.teams?.home?.logo ?? null,
    awayTeam: f.teams?.away?.name ?? "",
    awayLogo: f.teams?.away?.logo ?? null,
    kickoffAt: f.fixture?.date ?? null,
    homeScore: f.goals?.home ?? null,
    awayScore: f.goals?.away ?? null,
    finished: ["FT", "AET", "PEN"].includes(f.fixture?.status?.short ?? ""),
  }));
}

export async function fetchFixtureById(externalId: string): Promise<ApiFootballFixture | null> {
  const json = await apiFootball(`/fixtures?id=${encodeURIComponent(externalId)}`);
  const f = (json.response ?? [])[0];
  if (!f) return null;
  return {
    externalId,
    homeTeam: f.teams?.home?.name ?? "",
    homeLogo: f.teams?.home?.logo ?? null,
    awayTeam: f.teams?.away?.name ?? "",
    awayLogo: f.teams?.away?.logo ?? null,
    kickoffAt: f.fixture?.date ?? null,
    homeScore: f.goals?.home ?? null,
    awayScore: f.goals?.away ?? null,
    finished: ["FT", "AET", "PEN"].includes(f.fixture?.status?.short ?? ""),
  };
}

export async function searchTeam(name: string): Promise<{ name: string; logo: string } | null> {
  if (!name || name.length < 3) return null;

  // 1) API pública gratuita (TheSportsDB) — não exige chave
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`,
    );
    if (res.ok) {
      const json = (await res.json()) as any;
      const teams: any[] = json?.teams ?? [];
      const soccer = teams.filter((t) => t?.strSport === "Soccer");
      const t =
        soccer.find((x) => String(x?.strLeague ?? "").toLowerCase().includes("brazil")) ?? soccer[0];
      const logo = t?.strBadge ?? t?.strTeamBadge;
      if (t && logo) {
        return { name: t.strTeam ?? name, logo: String(logo) };
      }
    }
  } catch {
    // ignora e tenta a API-Football
  }

  // 2) Fallback: API-Football (se a chave estiver configurada)
  try {
    const json = await apiFootball(
      `/teams?search=${encodeURIComponent(name)}&league=${BRASILEIRAO_LEAGUE_ID}`,
    );
    const t = (json.response ?? [])[0];
    if (t?.team?.logo) return { name: t.team?.name ?? name, logo: t.team.logo };
  } catch {
    // sem chave ou sem resultado
  }

  return null;
}


function mpToken(): string {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) throw new Error("O token do Mercado Pago ainda não foi configurado.");
  return token;
}

export async function createPreference(params: {
  betId: string;
  amount: number;
  payerEmail: string;
  roundNumber: number;
  origin: string;
}): Promise<{ id: string; initPoint: string }> {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: params.betId,
          title: `Palpite da Rodada - Rodada ${params.roundNumber}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: params.amount,
        },
      ],
      payer: { email: params.payerEmail },
      external_reference: params.betId,
      notification_url: `${params.origin}/api/public/webhooks/mercadopago`,
      back_urls: {
        success: `${params.origin}/pagamento?status=sucesso`,
        pending: `${params.origin}/pagamento?status=pendente`,
        failure: `${params.origin}/pagamento?status=falha`,
      },
      auto_return: "approved",
    }),
  });
  const json = (await res.json()) as any;
  if (!res.ok) {
    console.error("Mercado Pago Error Details:", JSON.stringify(json, null, 2));
    throw new Error(`Mercado Pago [${res.status}]: ${json.message || JSON.stringify(json)}`);
  }
  return { id: json.id as string, initPoint: (json.init_point ?? json.sandbox_init_point) as string };
}

export async function getMercadoPagoPayment(paymentId: string): Promise<any> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago [${res.status}]: ${JSON.stringify(json)}`);
  return json;
}

export async function getMercadoPagoPaymentByPreference(preferenceId: string): Promise<any> {
  // /v1/payments/search NÃO aceita preference_id (retorna 400). O caminho correto
  // é buscar a merchant_order vinculada à preferência e, a partir dela, o pagamento.
  const res = await fetch(
    `https://api.mercadopago.com/merchant_orders/search?preference_id=${encodeURIComponent(preferenceId)}`,
    { headers: { Authorization: `Bearer ${mpToken()}` } },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago [${res.status}]: ${JSON.stringify(json)}`);
  const orders: any[] = json.elements ?? [];
  for (const order of orders) {
    const payments: any[] = order.payments ?? [];
    const chosen = payments.find((p) => p.status === "approved") ?? payments[0];
    if (chosen?.id) {
      try {
        return await getMercadoPagoPayment(String(chosen.id));
      } catch {
        // tenta a próxima ordem
      }
    }
  }
  return null;
}

/**
 * Reconcilia o estado de uma aposta com o Mercado Pago:
 * busca todos os pagamentos (por external_reference, payment_id e preference_id),
 * sincroniza os registros locais e marca a aposta como paga se houver aprovação.
 */
export async function reconcileBetPayments(betId: string): Promise<{ status: string; message: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("bet_id", betId);

  let mpPayments: any[] = [];
  try {
    mpPayments = await searchMercadoPagoPaymentsByExternalReference(betId);
  } catch (e) {
    console.error("reconcileBetPayments: erro na busca por external_reference", e);
  }

  if (mpPayments.length === 0) {
    for (const rec of payments ?? []) {
      if (rec.payment_id) {
        try {
          const p = await getMercadoPagoPayment(rec.payment_id);
          if (p) mpPayments.push(p);
        } catch {}
      }
      if (rec.preference_id) {
        try {
          const p = await getMercadoPagoPaymentByPreference(rec.preference_id);
          if (p) mpPayments.push(p);
        } catch {}
      }
    }
  }

  // Remove duplicados pelo ID do pagamento
  const seen = new Set<string>();
  mpPayments = mpPayments.filter((p) => {
    const id = String(p?.id ?? "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  let approvedFound = false;
  for (const mpPayment of mpPayments) {
    const mpId = String(mpPayment.id);

    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("payment_id", mpId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("payments")
        .update({ status: mpPayment.status, raw: mpPayment, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      const { data: betData } = await supabaseAdmin
        .from("bets")
        .select("user_id, amount")
        .eq("id", betId)
        .maybeSingle();
      if (betData) {
        // Vincula ao registro pendente mais recente (se houver) para não duplicar linhas
        const { data: pendingRow } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("bet_id", betId)
          .is("payment_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingRow) {
          await supabaseAdmin
            .from("payments")
            .update({
              payment_id: mpId,
              status: mpPayment.status,
              raw: mpPayment,
              updated_at: new Date().toISOString(),
            })
            .eq("id", pendingRow.id);
        } else {
          await supabaseAdmin.from("payments").insert({
            bet_id: betId,
            user_id: betData.user_id,
            payment_id: mpId,
            preference_id: mpPayment.preference_id ?? null,
            status: mpPayment.status,
            amount: betData.amount,
            raw: mpPayment,
          });
        }
      }
    }

    if (mpPayment.status === "approved") {
      approvedFound = true;
      await supabaseAdmin
        .from("bets")
        .update({
          status: "paid",
          paid_at: mpPayment.date_approved || new Date().toISOString(),
        })
        .eq("id", betId);
    }
  }

  if (approvedFound) {
    return { status: "approved", message: "Pagamento aprovado e aposta efetivada!" };
  }
  return {
    status: "pending",
    message: "Nenhum pagamento aprovado encontrado. Se você já pagou, aguarde alguns instantes ou verifique seu extrato.",
  };
}

export async function searchMercadoPagoPaymentsByExternalReference(externalReference: string): Promise<any[]> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${externalReference}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago [${res.status}]: ${JSON.stringify(json)}`);
  return json.results || [];
}
