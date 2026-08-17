# Plano de Correção da Pontuação de Empates

O objetivo é ajustar a lógica de pontuação para empates no banco de dados. Se o usuário prever um empate e ocorrer qualquer outro empate (que não seja o placar exato), ele deve receber exatamente 15 pontos, sem somar bônus de diferença de gols ou gols de um dos times.

## Alterações no Banco de Dados (Supabase)

1. **Atualizar a função `compute_pick_points`**:
   - Modificar a lógica para que, em caso de empate (não exato), a pontuação seja fixada em 15 pontos.
   - Garantir que, se o resultado for empate mas o usuário não palpitou empate, ele não receba os 15 pontos de tendência de empate.
   - Impedir a soma de pontos extras (como saldo de gols ou gols marcados) quando a regra dos 15 pontos de empate for aplicada.

```sql
CREATE OR REPLACE FUNCTION public.compute_pick_points(p_home integer, p_away integer, r_home integer, r_away integer)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE pts integer := 0;
BEGIN
  IF p_home IS NULL OR p_away IS NULL OR r_home IS NULL OR r_away IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. Placar Exato (30 pontos)
  IF p_home = r_home AND p_away = r_away THEN
    RETURN 30;
  END IF;

  -- 2. Caso seja Empate Real (r_home = r_away)
  IF r_home = r_away THEN
    -- Se o usuário também palpitou empate (mas não o placar exato, pois já retornamos 30 acima)
    IF p_home = p_away THEN
      RETURN 15; -- Apenas 15 pontos fixos conforme solicitado
    ELSE
      -- Usuário não palpitou empate, mas o jogo empatou.
      -- Pode ganhar 5 pontos se acertou o número de gols de um dos times.
      IF p_home = r_home OR p_away = r_away THEN
        pts := 5;
      END IF;
      RETURN pts;
    END IF;
  END IF;

  -- 3. Caso NÃO seja empate (Vitória de um dos lados)
  -- Tendência de quem vence (10 pontos)
  IF (p_home > p_away AND r_home > r_away) OR 
     (p_home < p_away AND r_home < r_away) THEN
    pts := 10;
    
    -- Acertou a diferença de gols (+5 pontos)
    IF (p_home - p_away) = (r_home - r_away) THEN
      pts := pts + 5;
    END IF;
  END IF;

  -- Acertou o número de gols de um dos times (+5 pontos)
  IF p_home = r_home OR p_away = r_away THEN
    pts := pts + 5;
  END IF;

  RETURN pts;
END;
$function$;
```

2. **Recalcular as pontuações existentes**:
   - Executar uma migração que chame a função de validação para as rodadas afetadas, garantindo que o ranking seja atualizado imediatamente com a nova regra.

## Verificação Técnica

- Realizar testes lógicos simulando:
  - Palpite 1-1, Resultado 2-2: Deve retornar 15 pontos.
  - Palpite 1-0, Resultado 0-0: Deve retornar 5 pontos (se acertou o zero da pontuação do visitante) ou 0.
  - Palpite 2-2, Resultado 2-2: Deve retornar 30 pontos (exato).
  - Palpite 1-1, Resultado 1-0: Deve retornar 5 pontos (acertou gols do mandante).
