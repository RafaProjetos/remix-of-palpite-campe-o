-- ============================================================
-- 1) Tabela leagues: habilitar RLS e restringir permissões
-- ============================================================

-- A configuração das ligas é pública para leitura (exibida nas telas),
-- mas somente leitura. Escrita fica restrita ao backend/admin.
REVOKE ALL ON public.leagues FROM anon, authenticated;
GRANT SELECT ON public.leagues TO anon, authenticated;
GRANT ALL ON public.leagues TO service_role;

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leagues_public_read"
ON public.leagues
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "leagues_admin_all"
ON public.leagues
FOR ALL
TO authenticated
USING (public.is_admin_self())
WITH CHECK (public.is_admin_self());

-- ============================================================
-- 2) Funções SECURITY DEFINER: remover execução pública
-- ------------------------------------------------------------
-- Todas as chamadas RPC do aplicativo passam pelo cliente de
-- serviço (service_role) no backend. Nenhuma chamada legítima
-- vem dos papéis anon/authenticated, então o EXECUTE público
-- pode ser revogado com segurança.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.general_ranking() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.general_ranking() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.league_stats(uuid, public.league_type) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.league_stats(uuid, public.league_type) TO service_role;

REVOKE EXECUTE ON FUNCTION public.recalculate_partial_scores(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_partial_scores(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.round_league_ranking(uuid, public.league_type) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.round_league_ranking(uuid, public.league_type) TO service_role;

REVOKE EXECUTE ON FUNCTION public.round_ranking(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.round_ranking(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.round_stats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.round_stats(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_bet_stats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_bet_stats(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.validate_round(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_round(uuid) TO service_role;