CREATE OR REPLACE FUNCTION public.is_free_league(_league_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.leagues l WHERE l.id = _league_id AND l.entry_fee = 0)
$function$;