import { test, expect } from 'bun:test';
import { isEligibleMatch, validateRoundPicks } from './match-participation';

test('jogo marcado como informativo não é elegível; desmarcado vale normalmente', () => {
  expect(isEligibleMatch({ excluded_from_round: true })).toBe(false);
  expect(isEligibleMatch({ excluded_from_round: false })).toBe(true);
  expect(isEligibleMatch({})).toBe(true);
});
test('palpites são exigidos apenas para jogos válidos', () => {
  expect(() => validateRoundPicks([{ id: 'a' }, { id: 'b', excluded_from_round: true }], [{ matchId: 'a' }])).not.toThrow();
  expect(() => validateRoundPicks([{ id: 'a' }, { id: 'b', excluded_from_round: true }], [{ matchId: 'a' }, { matchId: 'b' }])).toThrow();
});
test('jogo novo passa a exigir palpite sem aceitar IDs de outra rodada ou duplicados', () => {
  expect(() => validateRoundPicks([{ id: 'a' }, { id: 'novo' }], [{ matchId: 'a' }])).toThrow();
  expect(() => validateRoundPicks([{ id: 'a' }, { id: 'novo' }], [{ matchId: 'a' }, { matchId: 'novo' }])).not.toThrow();
  expect(() => validateRoundPicks([{ id: 'a' }], [{ matchId: 'outro' }])).toThrow();
  expect(() => validateRoundPicks([{ id: 'a' }], [{ matchId: 'a' }, { matchId: 'a' }])).toThrow();
});