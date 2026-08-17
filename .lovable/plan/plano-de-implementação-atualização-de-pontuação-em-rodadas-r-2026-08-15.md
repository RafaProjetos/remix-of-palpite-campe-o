# Plano de Implementação: Atualização de Pontuação em Rodadas Reabertas

O objetivo é garantir que, ao reabrir uma rodada e alterar seus resultados, a pontuação de todos os participantes seja recalculada corretamente. A infraestrutura de banco de dados (`validate_round` e `compute_pick_points`) já suporta o recálculo, mas precisamos garantir que o fluxo no Admin acione essas atualizações de forma consistente.

## Alterações Propostas

### Backend (Server Functions)

#### `src/lib/admin.functions.ts`
- Verificar se a função `adminValidateRound` está chamando corretamente a RPC `validate_round`.
- Confirmar que a lógica de reabertura de rodada (`adminReopenRound`) apenas altera o status, permitindo que o administrador edite os jogos.

### Frontend (Admin Panel)

#### `src/routes/_authenticated/admin.tsx`
- Garantir que o botão "Calcular pontuação e validar rodada" esteja disponível e funcional após a reabertura e edição dos resultados.
- Adicionar uma notificação clara de que a validação recalculará todas as pontuações da rodada.

## Verificação Técnica
- A função SQL `public.validate_round(_round_id uuid)` já realiza:
  1. `UPDATE public.bet_picks`: Recalcula pontos de cada palpite usando `compute_pick_points` e os placares atuais em `public.matches`.
  2. `UPDATE public.bets`: Atualiza o `total_points` somando os novos pontos dos picks.
  3. `UPDATE public.rounds`: Define o status como 'validated'.
- Como o administrador salva os resultados individualmente antes de validar, os novos placares estarão no banco quando `validate_round` for executada.

## Passos de Validação
1. Reabrir uma rodada encerrada via Admin.
2. Alterar o placar de um jogo.
3. Clicar em "Validar rodada".
4. Verificar na tela "Meus Palpites" ou no Ranking se a pontuação foi alterada conforme o novo placar.
