CREATE OR REPLACE FUNCTION public.is_free_league(_league_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.leagues l WHERE l.id = _league_id AND l.entry_fee = 0)
$$;

REVOKE EXECUTE ON FUNCTION public.is_free_league(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_free_league(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS bets_insert_own ON public.bets;
CREATE POLICY bets_insert_own ON public.bets
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (status = 'pending'::bet_status OR (status = 'paid'::bet_status AND public.is_free_league(league_id)))
  );

DROP POLICY IF EXISTS bets_update_own_pending ON public.bets;
CREATE POLICY bets_update_own_pending ON public.bets
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND (status = 'pending'::bet_status OR (status = 'paid'::bet_status AND public.is_free_league(league_id)))
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (status = 'pending'::bet_status OR (status = 'paid'::bet_status AND public.is_free_league(league_id)))
  );

DROP POLICY IF EXISTS bet_picks_write_own_pending ON public.bet_picks;
CREATE POLICY bet_picks_write_own_pending ON public.bet_picks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bets b
    WHERE b.id = bet_picks.bet_id
      AND b.user_id = auth.uid()
      AND (b.status = 'pending'::bet_status OR (b.status = 'paid'::bet_status AND public.is_free_league(b.league_id)))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bets b
    WHERE b.id = bet_picks.bet_id
      AND b.user_id = auth.uid()
      AND (b.status = 'pending'::bet_status OR (b.status = 'paid'::bet_status AND public.is_free_league(b.league_id)))
  ));