/** A rodada deixa de aceitar palpites por status ou pelo prazo configurado. */
export function canViewRoundPicks(round: { status: string; closes_at: string | null } | null | undefined) {
  if (!round) return false;
  return round.status === "closed" || round.status === "validated" ||
    (round.status === "open" && !!round.closes_at && new Date(round.closes_at).getTime() < Date.now());
}