# Plano de Refatoração: Sistema de Ligas, Pagamentos e Rankings

Refatoração da lógica de participação, pagamentos, desempates e premiações para implementar Ligas Segmentadas (Free, Bronze, Prata, Ouro) e critérios de desempate estritos.

## Mudanças Técnicas

### 1. Banco de Dados (Supabase) - **JÁ APLICADO**
- Criada tabela `leagues` com os tipos: `free` (R$ 0), `bronze` (R$ 5), `prata` (R$ 20), `ouro` (R$ 50).
- Adicionada coluna `league_id` na tabela `bets`.
- Adicionadas colunas `full_hits` (placares cheios) e `winner_hits` (vencedor/empate) na tabela `bets` para desempate.
- Criadas funções `round_league_ranking` e `league_stats` para suportar a nova estrutura.
- Atualizada função `validate_round` para calcular os novos critérios de desempate.

### 2. Backend (TanStack Server Functions)
- **src/lib/palpite.functions.ts**:
    - Atualizar `saveBet` para aceitar `leagueId`.
    - Atualizar `startPayment` para usar o valor dinâmico da liga.
    - Criar `getLeagues` para listar as ligas disponíveis.
    - Atualizar `getRankings` para suportar abas de ligas e critérios de desempate.
- **src/lib/palpite.server.ts**:
    - Ajustar `createPreference` para refletir os novos valores.
- **src/routes/api/public/webhooks/mercadopago.ts**:
    - Remover a trava de 100 participantes (será ilimitado por liga).

### 3. Frontend (UI/UX)
- **src/routes/_authenticated/palpitar.tsx**:
    - Adicionar abas/tabs para seleção de ligas (Free, Bronze, Prata, Ouro).
    - Exibir métricas em tempo real (Pote Líquido, Participantes) usando `league_stats`.
    - Permitir participação em múltiplas ligas na mesma rodada.
- **src/routes/ranking.tsx**:
    - Atualizar tabela para exibir colunas de desempate: Posição, Nome, Pontos, Placares Cheios, Acertos de Vencedor, Data/Hora.
    - Filtros por liga.

### 4. Correção de Erros de Compilação
- Ajustar todas as chamadas de `insert` na tabela `bets` para incluir o campo obrigatório `league_id`.

## Critérios de Desempate Estritos
1. Pontuação Total
2. Placar Cheio (full_hits)
3. Acerto de Vencedor/Saldo (winner_hits)
4. Data/Hora de Registro (created_at)
5. Ordem Alfabética (full_name)

## Regra de Premiação (Top 10)
- 10% Taxa da Plataforma.
- 90% Pote Líquido distribuído entre o Top 10:
    - 1º: 35%, 2º: 20%, 3º: 12%, 4º: 8%, 5º: 6%, 6º-10º: 3.8% cada.
