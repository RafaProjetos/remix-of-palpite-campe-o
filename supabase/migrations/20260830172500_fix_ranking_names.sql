-- =====================================================================
-- Corrige nomes no ranking: usa auth.users metadata como fallback.
-- Estratégia: cria view segura no schema public para expor apenas
-- o necessário de auth.users, evitando erro de search_path.
-- =====================================================================

-- 1. View segura que expõe nome + email de auth.users para uso interno
CREATE OR REPLACE VIEW public.user_display_names
WITH (security_invoker = false)
AS
  SELECT
    id,
    COALESCE(
      NULLIF(TRIM(raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(raw_user_meta_data->>'name'), ''),
      SPLIT_PART(email, '@', 1),
      'Apostador'
    ) AS display_name
  FROM auth.users;

-- Apenas service_role acessa a view (é usada apenas pelas funções SECURITY DEFINER)
REVOKE ALL ON public.user_display_names FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_display_names TO service_role;

-- 2. Atualiza profiles existentes sem nome usando a view
UPDATE public.profiles p
SET full_name = udn.display_name
FROM public.user_display_names udn
WHERE udn.id = p.id
  AND (p.full_name IS NULL OR TRIM(p.full_name) = '');

-- 3. Recria general_ranking com fallback via view
CREATE OR REPLACE FUNCTION public.general_ranking()
 RETURNS TABLE(user_id uuid, full_name text, total_points bigint, rounds_played bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.user_id, 
    COALESCE(NULLIF(TRIM(p.full_name), ''), udn.display_name, 'Apostador') AS full_name,
    SUM(b.total_points)::bigint, 
    COUNT(*)::bigint
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
  JOIN public.user_display_names udn ON udn.id = b.user_id
  JOIN public.rounds r ON r.id = b.round_id
  WHERE r.status = 'validated'
    AND b.excluded_from_ranking = false
    AND b.excluded_from_round = false
  GROUP BY b.user_id, p.full_name, udn.display_name
  ORDER BY 3 DESC, 2 ASC;
$function$;

-- 4. Recria round_league_ranking com fallback via view
CREATE OR REPLACE FUNCTION public.round_league_ranking(_round_id uuid, _league_type league_type)
 RETURNS TABLE(user_id uuid, full_name text, total_points integer, full_hits integer, winner_hits integer, created_at timestamp with time zone, row_position integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.user_id, 
    COALESCE(NULLIF(TRIM(p.full_name), ''), udn.display_name, 'Apostador') AS full_name,
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
            COALESCE(NULLIF(TRIM(p.full_name), ''), udn.display_name) ASC
    ))::integer as row_position
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
  JOIN public.user_display_names udn ON udn.id = b.user_id
  JOIN public.leagues l ON l.id = b.league_id
  WHERE b.round_id = _round_id 
    AND l.type = _league_type
    AND b.excluded_from_round = false
    AND (l.type = 'free' OR b.status = 'paid')
  ORDER BY row_position ASC;
$function$;

-- 5. Recria round_ranking com fallback via view
CREATE OR REPLACE FUNCTION public.round_ranking(_round_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, total_points bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.user_id, 
    COALESCE(NULLIF(TRIM(p.full_name), ''), udn.display_name, 'Apostador') AS full_name,
    b.total_points::bigint
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
  JOIN public.user_display_names udn ON udn.id = b.user_id
  WHERE b.round_id = _round_id
    AND b.excluded_from_round = false
  ORDER BY b.total_points DESC, COALESCE(NULLIF(TRIM(p.full_name), ''), udn.display_name) ASC;
$function$;
