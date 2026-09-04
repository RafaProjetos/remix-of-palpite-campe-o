CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''), ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;