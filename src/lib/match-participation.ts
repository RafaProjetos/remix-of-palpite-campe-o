export function isEligibleMatch(match: { excluded_from_round?: boolean }): boolean {
  return match.excluded_from_round !== true;
}

export function validateRoundPicks(matches: { id: string; excluded_from_round?: boolean }[], picks: { matchId: string }[]) {
  const eligible = matches.filter(isEligibleMatch);
  const ids = new Set(picks.map((pick) => pick.matchId));
  if (ids.size !== picks.length || picks.some((pick) => !eligible.some((match) => match.id === pick.matchId))) {
    throw new Error('Há jogos inválidos ou informativos nos palpites. Atualize a página.');
  }
  if (!eligible.length || eligible.some((match) => !ids.has(match.id))) {
    throw new Error('Preencha o placar de todos os jogos válidos da rodada.');
  }
}