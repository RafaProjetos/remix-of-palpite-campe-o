# Plano: Atualização dos Nomes dos Times (Nomes Completos)

O objetivo é substituir os nomes abreviados com hífen pelos nomes completos dos clubes na lista da Série A, conforme solicitado.

## Alterações

### Configurações (Backend/Data)

1.  **Atualizar `src/lib/constants.ts`**:
    *   Substituir `ATHLETICO-PR` por `ATHLETICO PARANAENSE`.
    *   Substituir `ATLÉTICO-GO` por `ATLÉTICO GOIANIENSE`.
    *   Substituir `ATLÉTICO-MG` por `ATLÉTICO MINEIRO`.
    *   Garantir que todos os nomes permaneçam em maiúsculo conforme a regra anterior.

## Detalhes Técnicos

*   A alteração será feita diretamente na constante `SERIE_A_TEAMS`.
*   Como o componente de `Select` no Admin já consome esta constante, a interface será atualizada automaticamente.

## Verificação

1.  Acessar a tela de administrador.
2.  Abrir a opção de "Criar rodada manual".
3.  Verificar se na lista suspensa os nomes aparecem como "ATHLETICO PARANAENSE", "ATLÉTICO GOIANIENSE" e "ATLÉTICO MINEIRO".
