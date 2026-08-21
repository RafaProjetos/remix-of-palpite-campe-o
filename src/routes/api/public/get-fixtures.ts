import { createFileRoute } from '@tanstack/react-router';

// ============================================================================
// Cache server-side das rodadas (tabela public.api_cache, acesso só do servidor)
//
// Fluxo:
//   1. O front-end chama ESTA rota (nunca a API externa diretamente).
//   2. Se existir cache válido no banco -> responde o JSON salvo (X-Cache: HIT).
//   3. Se expirou/ausente -> consulta a API-Football, salva no banco e responde
//      (X-Cache: MISS).
//   4. Se a API externa falhar -> serve o último cache conhecido, mesmo vencido
//      (X-Cache: STALE), para o site nunca ficar sem dados.
//
// Expiração (horário de Brasília):
//   - Terça a quinta: 24h  -> a API externa é consultada no máximo 1x por dia
//   - Sexta a segunda: 4h  -> dias de jogos, atualização a cada 4 horas
// ============================================================================

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const Route = createFileRoute('/api/public/get-fixtures')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const jsonHeaders = { 'Content-Type': 'application/json' };

        // Dia da semana em America/Sao_Paulo define o tempo de vida do cache
        const weekday = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Sao_Paulo',
          weekday: 'short',
        }).format(new Date());
        const ttlMs = ['Fri', 'Sat', 'Sun', 'Mon'].includes(weekday) ? FOUR_HOURS_MS : ONE_DAY_MS;

        const url = new URL(request.url);
        const season = parseInt(url.searchParams.get('season') || '2026');
        const leagueId = parseInt(url.searchParams.get('leagueId') || '71'); // Brasileirão Série A
        const roundParam = url.searchParams.get('round');
        const cacheKey = `fixtures:${season}:${leagueId}:${roundParam ?? 'current'}`;

        // 1) Lê o cache salvo (tabela acessível apenas pelo servidor)
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data: cached, error: cacheError } = await supabaseAdmin
          .from('api_cache')
          .select('payload, fetched_at')
          .eq('key', cacheKey)
          .maybeSingle();

        if (cacheError) {
          console.error('Erro ao ler o cache de fixtures:', cacheError);
        }

        const fetchedAtMs = cached ? new Date(cached.fetched_at).getTime() : 0;
        const isFresh = Boolean(cached) && Date.now() - fetchedAtMs < ttlMs;

        // 2) Cache válido: responde o JSON salvo sem consultar a API externa
        if (isFresh && cached) {
          return new Response(JSON.stringify(cached.payload), {
            headers: {
              ...jsonHeaders,
              'X-Cache': 'HIT',
              'X-Cache-Fetched-At': cached.fetched_at,
              'Cache-Control': 'public, max-age=60',
            },
          });
        }

        // 3) Cache expirado ou inexistente: consulta a API externa e renova o cache
        try {
          const apiKey = process.env['API_FOOTBALL_KEY'] || process.env['FOOTBALL_API_KEY'];

          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'FOOTBALL_API_KEY not configured' }), {
              status: 500,
              headers: jsonHeaders,
            });
          }

          // Descobre a rodada atual, se não informada
          let round = roundParam;
          if (!round) {
            const currentRoundRes = await fetch(
              `https://v3.football.api-sports.io/fixtures/rounds?league=${leagueId}&season=${season}&current=true`,
              { headers: { 'x-apisports-key': apiKey } },
            );
            const currentRoundJson = await currentRoundRes.json();
            if (currentRoundJson.errors && Object.keys(currentRoundJson.errors).length > 0) {
              throw new Error(`API-Football: ${JSON.stringify(currentRoundJson.errors)}`);
            }
            round = currentRoundJson.response?.[0];
          }

          if (!round) {
            return new Response(JSON.stringify({ error: 'Could not determine current round' }), {
              status: 404,
              headers: jsonHeaders,
            });
          }

          // Busca os jogos da rodada
          const fixturesRes = await fetch(
            `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&round=${encodeURIComponent(round)}`,
            { headers: { 'x-apisports-key': apiKey } },
          );

          const fixturesJson = await fixturesRes.json();
          if (fixturesJson.errors && Object.keys(fixturesJson.errors).length > 0) {
            throw new Error(`API-Football: ${JSON.stringify(fixturesJson.errors)}`);
          }
          const rawFixtures = fixturesJson.response || [];

          const treatedFixtures = rawFixtures.map((f: any) => ({
            id: f.fixture.id,
            date: f.fixture.date, // ISO format
            timestamp: f.fixture.timestamp,
            venue: f.fixture.venue.name,
            status: f.fixture.status,
            league: {
              name: f.league.name,
              round: f.league.round,
            },
            homeTeam: {
              id: f.teams.home.id,
              name: f.teams.home.name,
              logo: f.teams.home.logo,
            },
            awayTeam: {
              id: f.teams.away.id,
              name: f.teams.away.name,
              logo: f.teams.away.logo,
            },
          }));

          const payload = { round, fixtures: treatedFixtures };

          // Salva/atualiza o cache no banco
          const { error: upsertError } = await supabaseAdmin.from('api_cache').upsert({
            key: cacheKey,
            payload,
            fetched_at: new Date().toISOString(),
          });
          if (upsertError) {
            console.error('Erro ao gravar o cache de fixtures:', upsertError);
          }

          return new Response(JSON.stringify(payload), {
            headers: {
              ...jsonHeaders,
              'X-Cache': 'MISS',
              'Cache-Control': 'public, max-age=60',
            },
          });
        } catch (error: any) {
          console.error('Error fetching fixtures:', error);

          // 4) API externa indisponível: serve o último cache conhecido (mesmo vencido)
          if (cached) {
            return new Response(JSON.stringify(cached.payload), {
              headers: {
                ...jsonHeaders,
                'X-Cache': 'STALE',
                'X-Cache-Fetched-At': cached.fetched_at,
                'Cache-Control': 'public, max-age=60',
              },
            });
          }

          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: jsonHeaders,
          });
        }
      },
    },
  },
});
