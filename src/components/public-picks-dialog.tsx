import { useQuery } from "@tanstack/react-query";
import { getPublicBetPicks } from "@/lib/palpite.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PublicPicksDialog({ roundId, leagueType, participant, onClose }: {
  roundId: string | null;
  leagueType: string;
  participant: { id: string; nome: string } | null;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["palpites-publicos", roundId, leagueType, participant?.id],
    queryFn: () => {
      if (!roundId || !participant) return null;
      return getPublicBetPicks({ data: { roundId, leagueType, userId: participant.id } });
    },
    enabled: !!roundId && !!participant,
    refetchInterval: participant ? 30_000 : false,
  });
  const detail = query.data;
  return (
    <Dialog open={!!participant} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-5 text-base sm:text-lg">Palpites de {participant?.nome}</DialogTitle>
          <DialogDescription>
            {detail?.bet ? `${detail.leagueName} · Rodada ${detail.roundNumber} · ${detail.bet.total_points} pts` : "Palpites da rodada"}
          </DialogDescription>
        </DialogHeader>
        {query.isFetching && !detail ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando palpites...</p>
        ) : query.isError ? (
          <div className="space-y-3 py-4 text-center" role="alert">
            <p className="text-sm text-destructive">Não foi possível carregar os palpites.</p>
            <Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button>
          </div>
        ) : !detail?.bet ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Não há palpites disponíveis para este participante nesta liga.</p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {detail.matches.map((match: any) => {
              const pick = detail.picks.find((item: any) => item.match_id === match.id);
              return (
                <div key={match.id} className="rounded-md border p-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate">{match.home_team}</span>
                    <span className="shrink-0 font-bold">{pick ? `${pick.home_score} x ${pick.away_score}` : "—"}</span>
                    <span className="min-w-0 flex-1 truncate text-right">{match.away_team}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Resultado: {match.home_score !== null && match.away_score !== null ? `${match.home_score} x ${match.away_score}` : "não informado"}</span>
                    <Badge variant={pick && pick.points > 0 ? "default" : "outline"} className="text-[10px]">{pick ? `${pick.points} pts` : "0 pts"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}