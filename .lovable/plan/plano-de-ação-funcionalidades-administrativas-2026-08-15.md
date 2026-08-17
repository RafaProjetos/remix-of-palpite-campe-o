# Plano de Ação - Funcionalidades Administrativas

Adicionar botões e lógica para reabrir rodadas encerradas e finalizar a temporada com exportação de relatório.

## Alterações

### Backend (Server Functions)

1.  **`src/lib/admin.functions.ts`**:
    *   Implementar `adminEndSeason`:
        *   Marca todas as rodadas (`rounds`) como `closed`.
        *   Gera um relatório completo de todos os participantes, suas pontuações acumuladas e status de pagamento da temporada.
    *   Implementar `adminReopenRound`:
        *   Altera o status de uma rodada de `closed` ou `validated` de volta para `open`.
        *   (Opcional) Limpa as pontuações calculadas se necessário, permitindo a revalidação posterior.

### Frontend (Painel Administrativo)

2.  **`src/routes/_authenticated/admin.tsx`**:
    *   Adicionar botão "Reabrir Rodada" visível apenas quando a rodada estiver `closed` ou `validated`.
    *   Adicionar botão "Encerrar Temporada" no topo do painel.
    *   Implementar diálogo de confirmação para o encerramento da temporada.
    *   Integrar a exportação para Excel do relatório final da temporada ao clicar em encerrar.

## Detalhes Técnicos

*   O encerramento da temporada deve ser uma operação protegida por confirmação para evitar cliques acidentais.
*   A exportação do relatório de temporada usará `xlsx` (já presente no projeto).
*   A reabertura de rodada deve garantir que o administrador possa corrigir placares e disparar a validação (`adminValidateRound`) novamente.
