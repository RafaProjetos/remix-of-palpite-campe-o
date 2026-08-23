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
  const res = await fetch(`https://api.mercadopago.com/v1/payments/search?preference_id=${preferenceId}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago [${res.status}]: ${JSON.stringify(json)}`);
  // O search retorna uma lista de pagamentos associados à preferência
  return json.results?.[0] || null;

export async function searchMercadoPagoPaymentsByExternalReference(externalReference: string): Promise<any[]> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${externalReference}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Mercado Pago [${res.status}]: ${JSON.stringify(json)}`);
  return json.results || [];
}
