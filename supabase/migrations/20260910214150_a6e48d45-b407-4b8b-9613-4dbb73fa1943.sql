CREATE POLICY "api_cache_service_role_only"
ON public.api_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);