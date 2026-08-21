
-- 1. Enum para as ligas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'league_type') THEN
        CREATE TYPE public.league_type AS ENUM ('free', 'bronze', 'prata', 'ouro');
    END IF;
END $$;

-- 2. Tabela de Ligas
CREATE TABLE IF NOT EXISTS public.leagues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type league_type NOT NULL UNIQUE,
    name text NOT NULL,
    entry_fee numeric NOT NULL,
    platform_fee_percent numeric NOT NULL DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.leagues TO authenticated;
GRANT ALL ON public.leagues TO service_role;

-- Inserir ligas padrão
INSERT INTO public.leagues (type, name, entry_fee) VALUES
('free', 'Liga Free', 0.00),
('bronze', 'Liga Bronze', 5.00),
('prata', 'Liga Prata', 20.00),
('ouro', 'Liga Ouro', 50.00)
ON CONFLICT (type) DO NOTHING;

-- 3. Adicionar league_id à tabela bets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bets' AND column_name = 'league_id') THEN
        ALTER TABLE public.bets ADD COLUMN league_id uuid REFERENCES public.leagues(id);
        
        -- Migrar apostas existentes (que eram R$ 50) para a liga Ouro
        UPDATE public.bets SET league_id = (SELECT id FROM public.leagues WHERE type = 'ouro') WHERE league_id IS NULL;
        ALTER TABLE public.bets ALTER COLUMN league_id SET NOT NULL;
    END IF;
END $$;

-- 4. Adicionar campos de desempate em bets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bets' AND column_name = 'full_hits') THEN
        ALTER TABLE public.bets ADD COLUMN full_hits integer DEFAULT 0;
        ALTER TABLE public.bets ADD COLUMN winner_hits integer DEFAULT 0;
    END IF;
END $$;

-- 5. Função para atualizar estatísticas da aposta
CREATE OR REPLACE FUNCTION public.update_bet_stats(_bet_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_full_hits integer := 0;
    v_winner_hits integer := 0;
    v_total_points integer := 0;
BEGIN
    -- Placar cheio
    SELECT count(*) INTO v_full_hits
    FROM bet_picks bp
    JOIN matches m ON m.id = bp.match_id
    WHERE bp.bet_id = _bet_id
      AND bp.home_score = m.home_score
      AND bp.away_score = m.away_score
      AND m.home_score IS NOT NULL;

    -- Acerto de vencedor ou empate (que não seja placar cheio)
    SELECT count(*) INTO v_winner_hits
    FROM bet_picks bp
    JOIN matches m ON m.id = bp.match_id
    WHERE bp.bet_id = _bet_id
      AND m.home_score IS NOT NULL
      AND (
        (bp.home_score > bp.away_score AND m.home_score > m.away_score) OR
        (bp.home_score < bp.away_score AND m.home_score < m.away_score) OR
        (bp.home_score = bp.away_score AND m.home_score = m.away_score)
      )
      AND NOT (bp.home_score = m.home_score AND bp.away_score = m.away_score);

    SELECT COALESCE(SUM(points), 0) INTO v_total_points
    FROM bet_picks
    WHERE bet_id = _bet_id;

    UPDATE bets
    SET total_points = v_total_points,
        full_hits = v_full_hits,
        winner_hits = v_winner_hits,
        updated_at = now()
    WHERE id = _bet_id;
END;
$$;

-- 6. Refatorar validate_round
CREATE OR REPLACE FUNCTION public.validate_round(_round_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    b_row RECORD;
BEGIN
  UPDATE public.bet_picks bp
  SET points = public.compute_pick_points(bp.home_score, bp.away_score, m.home_score, m.away_score)
  FROM public.matches m, public.bets b
  WHERE m.id = bp.match_id AND b.id = bp.bet_id
    AND b.round_id = _round_id AND m.round_id = _round_id;

  FOR b_row IN SELECT id FROM public.bets WHERE round_id = _round_id LOOP
      PERFORM public.update_bet_stats(b_row.id);
  END LOOP;

  UPDATE public.rounds SET status = 'validated' WHERE id = _round_id;
END;
$function$;

-- 7. Ranking de rodada por liga
CREATE OR REPLACE FUNCTION public.round_league_ranking(_round_id uuid, _league_type league_type)
RETURNS TABLE(
    user_id uuid, 
    full_name text, 
    total_points integer, 
    full_hits integer, 
    winner_hits integer, 
    created_at timestamptz,
    row_position integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    AND (l.type = 'free' OR b.status = 'paid')
  ORDER BY row_position ASC;
$$;

GRANT EXECUTE ON FUNCTION public.round_league_ranking TO authenticated;

-- 8. Estatísticas da liga
CREATE OR REPLACE FUNCTION public.league_stats(_round_id uuid, _league_type league_type)
RETURNS TABLE(
    total_participants bigint,
    gross_pot numeric,
    net_pot numeric,
    platform_fee numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT 
        COUNT(*)::bigint as total_participants,
        COALESCE(SUM(b.amount), 0)::numeric as gross_pot,
        (COALESCE(SUM(b.amount), 0) * 0.9)::numeric as net_pot,
        (COALESCE(SUM(b.amount), 0) * 0.1)::numeric as platform_fee
    FROM public.bets b
    JOIN public.leagues l ON l.id = b.league_id
    WHERE b.round_id = _round_id 
      AND l.type = _league_type
      AND (l.type = 'free' OR b.status = 'paid');
$$;

GRANT EXECUTE ON FUNCTION public.league_stats TO authenticated;
