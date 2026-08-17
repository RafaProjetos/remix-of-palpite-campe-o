# Plano de Atualização de Pontuação em Tempo Real e Rankings

O objetivo é garantir que os usuários vejam sua pontuação parcial assim que um administrador salvar o resultado de um jogo individual, enquanto os rankings (Geral e Premiado) permaneçam inalterados até que a rodada seja formalmente validada.

## Alterações Sugeridas

### 1. Banco de Dados (SQL)
- Criar uma nova função SQL `public.recalculate_partial_scores(_round_id uuid)` que atualiza apenas os pontos dos `bet_picks` e o total parcial nas `bets` para a rodada, sem alterar o status da rodada para "validada".
- Essa função será utilizada para o feedback em "tempo real" para o usuário.

### 2. Backend (Server Functions)
- **adminSaveResults** (`src/lib/admin.functions.ts`):
  - Após salvar os resultados individuais, chamar a nova função RPC `recalculate_partial_scores`.
  - Isso garantirá que a pontuação parcial esteja disponível assim que o "Salvar" for clicado no admin.

### 3. Rankings (Frontend e API)
- **getRankings** (`src/lib/palpite.functions.ts`):
  - Modificar a lógica para que os rankings Geral e Premiado considerem apenas apostas de rodadas com status `validated`.
  - O ranking da rodada atual continuará mostrando a pontuação parcial (conforme já faz ao ler `bets.total_points`).
- **general_ranking** (SQL):
  - Atualizar a função SQL para filtrar apenas rodadas validadas: `WHERE b.round_id IN (SELECT id FROM public.rounds WHERE status = 'validated')`.

### 4. Interface Administrativa
- **Admin** (`src/routes/_authenticated/admin.tsx`):
  - Manter o fluxo atual de salvar placares individuais.
  - O botão "Calcular pontuação e validar rodada" continuará sendo o gatilho oficial para encerrar a rodada e consolidar os rankings.

## Detalhes Técnicos
- A separação entre "Pontuação Parcial" e "Ranking Consolidado" é fundamental para a experiência do usuário, permitindo que ele acompanhe seu desempenho sem afetar a classificação definitiva prematuramente.
- A migração SQL incluirá a atualização da função `general_ranking` e a criação da `recalculate_partial_scores`.

---

Este plano foca na consistência dos dados e na melhoria da experiência do usuário (UX) em tempo real.
