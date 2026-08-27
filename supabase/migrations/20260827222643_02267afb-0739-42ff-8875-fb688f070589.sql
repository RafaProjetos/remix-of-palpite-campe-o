DROP POLICY IF EXISTS bets_delete_own_pending ON public.bets;
CREATE POLICY bets_delete_own_pending ON public.bets
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND (status = 'pending'::bet_status OR (status = 'paid'::bet_status AND public.is_free_league(league_id)))
);

DROP POLICY IF EXISTS bet_picks_delete_own_pending ON public.bet_picks;
CREATE POLICY bet_picks_delete_own_pending ON public.bet_picks
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bets b
    WHERE b.id = bet_picks.bet_id
      AND b.user_id = auth.uid()
      AND (b.status = 'pending'::bet_status OR (b.status = 'paid'::bet_status AND public.is_free_league(b.league_id)))
  )
);

GRANT DELETE ON public.bets TO authenticated;
GRANT DELETE ON public.bet_picks TO authenticated;