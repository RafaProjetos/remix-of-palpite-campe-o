CREATE OR REPLACE FUNCTION public.general_ranking()
RETURNS TABLE(user_id uuid, full_name text, total_points bigint, rounds_played bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    b.user_id,
    COALESCE(
      NULLIF(btrim(p.full_name), ''),
      NULLIF(split_part(p.email, '@', 1), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(split_part(u.email, '@', 1), '')
    ) AS full_name,
    SUM(b.total_points)::bigint,
    COUNT(*)::bigint
  FROM public.bets b
  JOIN auth.users u ON u.id = b.user_id
  LEFT JOIN public.profiles p ON p.id = b.user_id
  JOIN public.rounds r ON r.id = b.round_id
  WHERE r.status = 'validated'
    AND b.excluded_from_ranking = false
    AND b.excluded_from_round = false
  GROUP BY b.user_id, p.full_name, p.email, u.email, u.raw_user_meta_data
  ORDER BY 3 DESC, 2 ASC NULLS LAST;
$function$;

CREATE OR REPLACE FUNCTION public.round_league_ranking(_round_id uuid, _league_type public.league_type)
RETURNS TABLE(user_id uuid, full_name text, total_points integer, full_hits integer, winner_hits integer, created_at timestamp with time zone, row_position integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    b.user_id,
    COALESCE(
      NULLIF(btrim(p.full_name), ''),
      NULLIF(split_part(p.email, '@', 1), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(split_part(u.email, '@', 1), '')
    ) AS full_name,
    b.total_points,
    b.full_hits,
    b.winner_hits,
    b.created_at,
    (ROW_NUMBER() OVER (
      ORDER BY
        b.total_points DESC,
        b.full_hits DESC,
        b.winner_hits DESC,
        b.created_at ASC,
        COALESCE(
          NULLIF(btrim(p.full_name), ''),
          NULLIF(split_part(p.email, '@', 1), ''),
          NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
          NULLIF(btrim(u.raw_user_meta_data ->> 'name'), ''),
          NULLIF(split_part(u.email, '@', 1), '')
        ) ASC NULLS LAST
    ))::integer AS row_position
  FROM public.bets b
  JOIN auth.users u ON u.id = b.user_id
  LEFT JOIN public.profiles p ON p.id = b.user_id
  JOIN public.leagues l ON l.id = b.league_id
  WHERE b.round_id = _round_id
    AND l.type = _league_type
    AND b.excluded_from_round = false
    AND (l.type = 'free' OR b.status = 'paid')
  ORDER BY row_position ASC;
$function$;

CREATE OR REPLACE FUNCTION public.round_ranking(_round_id uuid)
RETURNS TABLE(user_id uuid, full_name text, total_points bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    b.user_id,
    COALESCE(
      NULLIF(btrim(p.full_name), ''),
      NULLIF(split_part(p.email, '@', 1), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(btrim(u.raw_user_meta_data ->> 'name'), ''),
      NULLIF(split_part(u.email, '@', 1), '')
    ) AS full_name,
    b.total_points::bigint
  FROM public.bets b
  JOIN auth.users u ON u.id = b.user_id
  LEFT JOIN public.profiles p ON p.id = b.user_id
  WHERE b.round_id = _round_id
    AND b.excluded_from_round = false
  ORDER BY b.total_points DESC, full_name ASC NULLS LAST;
$function$;

REVOKE ALL ON FUNCTION public.general_ranking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.round_league_ranking(uuid, public.league_type) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.round_ranking(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.general_ranking() TO service_role;
GRANT EXECUTE ON FUNCTION public.round_league_ranking(uuid, public.league_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.round_ranking(uuid) TO service_role;