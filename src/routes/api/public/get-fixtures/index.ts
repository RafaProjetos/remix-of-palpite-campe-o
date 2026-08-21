import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/api/public/get-fixtures')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const season = parseInt(url.searchParams.get('season') || '2026');
          const leagueId = parseInt(url.searchParams.get('leagueId') || '71'); // Default: Brasileirão Série A

          const apiKey = process.env['API_FOOTBALL_KEY'] || process.env['FOOTBALL_API_KEY'];
          
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'FOOTBALL_API_KEY not configured' }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // First, get the current round if not specified
          let round = url.searchParams.get('round');
          if (!round) {
            const currentRoundRes = await fetch(`https://v3.football.api-sports.io/fixtures/rounds?league=${leagueId}&season=${season}&current=true`, {
              headers: { 'x-apisports-key': apiKey }
            });
            const currentRoundJson = await currentRoundRes.json();
            round = currentRoundJson.response?.[0];
          }

          if (!round) {
            return new Response(JSON.stringify({ error: 'Could not determine current round' }), { 
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Fetch fixtures for the round
          const fixturesRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&round=${encodeURIComponent(round)}`, {
            headers: { 'x-apisports-key': apiKey }
          });
          
          const fixturesJson = await fixturesRes.json();
          const rawFixtures = fixturesJson.response || [];

          // Map and clean the data for the frontend
          const treatedFixtures = rawFixtures.map((f: any) => ({
            id: f.fixture.id,
            date: f.fixture.date, // ISO format
            timestamp: f.fixture.timestamp,
            venue: f.fixture.venue.name,
            status: f.fixture.status,
            league: {
              name: f.league.name,
              round: f.league.round
            },
            homeTeam: {
              id: f.teams.home.id,
              name: f.teams.home.name,
              logo: f.teams.home.logo
            },
            awayTeam: {
              id: f.teams.away.id,
              name: f.teams.away.name,
              logo: f.teams.away.logo
            }
          }));

          return new Response(JSON.stringify({
            round,
            fixtures: treatedFixtures
          }), {
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error: any) {
          console.error('Error fetching fixtures:', error);
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
