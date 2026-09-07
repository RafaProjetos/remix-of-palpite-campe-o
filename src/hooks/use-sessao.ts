import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Retorna true quando existe sessão ativa (null enquanto verifica). */
export function useSessao() {
  const [temSessao, setTemSessao] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setTemSessao(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTemSessao(Boolean(session));
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return temSessao;
}
