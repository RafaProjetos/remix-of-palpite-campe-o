ALTER TABLE public.bets
  ADD COLUMN IF NOT EXISTS excluded_from_round boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS excluded_from_ranking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS excluded_at timestamptz;

CREATE OR REPLACE FUNCTION public.general_ranking()
 RETURNS TABLE(user_id uuid, full_name text, total_points bigint, rounds_played bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.user_id, 
    COALESCE(NULLIF(p.full_name, ''), 'Apostador'),
    SUM(b.total_points)::bigint, 
    COUNT(*)::bigint
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
  JOIN public.rounds r ON r.id = b.round_id
  WHERE r.status = 'validated'
    AND b.excluded_from_ranking = false
    AND b.excluded_from_round = false
  GROUP BY b.user_id, p.full_name
  ORDER BY 3 DESC, 2 ASC;
$function$;

CREATE OR REPLACE FUNCTION public.round_league_ranking(_round_id uuid, _league_type league_type)
 RETURNS TABLE(user_id uuid, full_name text, total_points integer, full_hits integer, winner_hits integer, created_at timestamp with time zone, row_position integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.user_id, 
    COALESCE(NULLIF(p.full_name, ''), 'Apostador'), 
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
            p.full_name ASC
    ))::integer as row_position
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
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
  SELECT b.user_id, COALESCE(NULLIF(p.full_name, ''), 'Apostador'), b.total_points::bigint
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
  WHERE b.round_id = _round_id
    AND b.excluded_from_round = false
  ORDER BY b.total_points DESC, p.full_name ASC;
$function$;

CREATE OR REPLACE FUNCTION public.round_stats(_round_id uuid)
 RETURNS TABLE(paid_count bigint, total_amount numeric, max_players integer, total_participants bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*) FILTER (WHERE b.status = 'paid')::bigint,
         COALESCE(SUM(b.amount) FILTER (WHERE b.status = 'paid'), 0)::numeric,
         (SELECT r.max_players FROM public.rounds r WHERE r.id = _round_id),
         COUNT(*)::bigint
  FROM public.bets b WHERE b.round_id = _round_id AND b.excluded_from_round = false;
$function$;

CREATE OR REPLACE FUNCTION public.league_stats(_round_id uuid, _league_type league_type)
 RETURNS TABLE(total_participants bigint, gross_pot numeric, net_pot numeric, platform_fee numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT 
        COUNT(*)::bigint as total_participants,
        COALESCE(SUM(b.amount), 0)::numeric as gross_pot,
        (COALESCE(SUM(b.amount), 0) * 0.9)::numeric as net_pot,
        (COALESCE(SUM(b.amount), 0) * 0.1)::numeric as platform_fee
    FROM public.bets b
    JOIN public.leagues l ON l.id = b.league_id
    WHERE b.round_id = _round_id 
      AND l.type = _league_type
      AND b.excluded_from_round = false
      AND (l.type = 'free' OR b.status = 'paid');
$function$;