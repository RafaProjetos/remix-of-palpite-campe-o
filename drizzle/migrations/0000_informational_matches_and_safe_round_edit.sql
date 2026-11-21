ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS excluded_from_round boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.recalculate_partial_scores(_round_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE b_row record;
BEGIN
 UPDATE public.bet_picks bp SET points = CASE WHEN m.excluded_from_round THEN 0 ELSE public.compute_pick_points(bp.home_score,bp.away_score,m.home_score,m.away_score) END FROM public.matches m, public.bets b WHERE m.id=bp.match_id AND b.id=bp.bet_id AND b.round_id=_round_id AND m.round_id=_round_id;
 FOR b_row IN SELECT id FROM public.bets WHERE round_id=_round_id LOOP PERFORM public.update_bet_stats(b_row.id); END LOOP;
END; $$;
CREATE OR REPLACE FUNCTION public.update_bet_stats(_bet_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
 UPDATE public.bets SET total_points=COALESCE((SELECT SUM(bp.points) FROM public.bet_picks bp JOIN public.matches m ON m.id=bp.match_id WHERE bp.bet_id=_bet_id AND NOT m.excluded_from_round),0),
 full_hits=(SELECT count(*) FROM public.bet_picks bp JOIN public.matches m ON m.id=bp.match_id WHERE bp.bet_id=_bet_id AND NOT m.excluded_from_round AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL AND bp.home_score=m.home_score AND bp.away_score=m.away_score),
 winner_hits=(SELECT count(*) FROM public.bet_picks bp JOIN public.matches m ON m.id=bp.match_id WHERE bp.bet_id=_bet_id AND NOT m.excluded_from_round AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL AND sign(bp.home_score-bp.away_score)=sign(m.home_score-m.away_score) AND NOT(bp.home_score=m.home_score AND bp.away_score=m.away_score)), updated_at=now() WHERE id=_bet_id;
END; $$;
CREATE OR REPLACE FUNCTION public.validate_round(_round_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
 PERFORM public.recalculate_partial_scores(_round_id);
 UPDATE public.rounds SET status='validated' WHERE id=_round_id;
END; $$;
REVOKE ALL ON FUNCTION public.recalculate_partial_scores(uuid),public.update_bet_stats(uuid),public.validate_round(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_partial_scores(uuid),public.update_bet_stats(uuid),public.validate_round(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_save_round_matches(_round_id uuid,_closes_at timestamptz,_matches jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public AS $$
DECLARE r public.rounds; item jsonb; mid uuid; pos integer:=0;
BEGIN
 SELECT * INTO r FROM public.rounds WHERE id=_round_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rodada não encontrada.'; END IF;
 IF jsonb_typeof(_matches)<>'array' OR jsonb_array_length(_matches)=0 THEN RAISE EXCEPTION 'Preencha ao menos um jogo.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(_matches) LOOP
  pos:=pos+1;
  mid:=NULLIF(item->>'id','')::uuid;
  IF mid IS NULL THEN
   IF r.status<>'open' OR (r.closes_at IS NOT NULL AND r.closes_at<=now()) THEN RAISE EXCEPTION 'Novos jogos só podem ser inseridos enquanto a rodada aceita palpites.'; END IF;
   INSERT INTO public.matches(round_id,position,home_team,away_team,home_logo,away_logo,excluded_from_round) VALUES(_round_id,pos,item->>'homeTeam',item->>'awayTeam',NULLIF(item->>'homeLogo',''),NULLIF(item->>'awayLogo',''),COALESCE((item->>'excludedFromRound')::boolean,false));
  ELSE
   UPDATE public.matches SET position=pos,home_team=item->>'homeTeam',away_team=item->>'awayTeam',home_logo=NULLIF(item->>'homeLogo',''),away_logo=NULLIF(item->>'awayLogo',''),excluded_from_round=COALESCE((item->>'excludedFromRound')::boolean,false) WHERE id=mid AND round_id=_round_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Jogo não pertence a esta rodada.'; END IF;
  END IF;
 END LOOP;
 UPDATE public.rounds SET closes_at=_closes_at WHERE id=_round_id;
 PERFORM public.recalculate_partial_scores(_round_id);
END; $$;
REVOKE ALL ON FUNCTION public.admin_save_round_matches(uuid,timestamptz,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_round_matches(uuid,timestamptz,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.reject_informational_pick() RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.matches WHERE id=NEW.match_id AND excluded_from_round) THEN RAISE EXCEPTION 'Esse jogo não vale para essa rodada'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.matches m JOIN public.bets b ON b.round_id=m.round_id WHERE m.id=NEW.match_id AND b.id=NEW.bet_id) THEN RAISE EXCEPTION 'Jogo não pertence a esta rodada.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER reject_informational_pick BEFORE INSERT OR UPDATE OF match_id,home_score,away_score ON public.bet_picks FOR EACH ROW EXECUTE FUNCTION public.reject_informational_pick();