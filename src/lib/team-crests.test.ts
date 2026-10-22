import { describe, expect, test } from 'bun:test';
import { SERIE_A_TEAMS } from './constants';
import { getTeamCrest, TEAM_CRESTS } from './team-crests';

describe('biblioteca permanente de escudos', () => {
  test('todos os 20 times disponíveis têm um escudo armazenado no site', () => {
    expect(SERIE_A_TEAMS).toHaveLength(20);
    expect(Object.keys(TEAM_CRESTS).sort()).toEqual(SERIE_A_TEAMS);
    for (const team of SERIE_A_TEAMS) {
      expect(getTeamCrest(team)).toMatch(/^\/__l5e\/assets-v1\/[^/]+\/[^/]+\.png$/);
    }
  });
  test('o escudo do Remo está disponível e nomes são normalizados', () => {
    expect(getTeamCrest(' remo ')).toBe(TEAM_CRESTS.REMO);
    expect(getTeamCrest(' remo ')).toContain('/remo.png');
    expect(getTeamCrest('time inexistente')).toBeUndefined();
  });
});
