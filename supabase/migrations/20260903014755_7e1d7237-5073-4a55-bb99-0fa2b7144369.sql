REVOKE EXECUTE ON FUNCTION public.round_league_ranking(uuid, league_type) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.round_ranking(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.general_ranking() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.round_league_ranking(uuid, league_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.round_ranking(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.general_ranking() TO service_role;