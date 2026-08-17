# Plano de Implementação: Gestão de Rodadas e Meus Palpites

Este plano detalha as alterações necessárias para adicionar o fechamento automático de rodadas por horário e a nova tela "Meus Palpites" para os usuários, com controle de edição baseado no status da rodada.

## 1. Banco de Dados (Supabase)
- Alterar a tabela `public.rounds` para adicionar a coluna `closes_at` (TIMESTAMP WITH TIME ZONE).
- Garantir que as políticas de RLS e `GRANT`s permitam o acesso necessário.

## 2. Lógica do Servidor (Backend)
- **`src/lib/admin.functions.ts`**:
    - Atualizar `adminCreateRound` e `adminSaveMatches` para aceitar e persistir a data de fechamento.
- **`src/lib/palpite.functions.ts`**:
    - Modificar `saveBet` para validar se a rodada está aberta com base na nova regra: `status === 'open'` E `closes_at > NOW()`.
    - Criar ou atualizar funções para listar os palpites do usuário logado (considerando todas as rodadas ou apenas a atual).

## 3. Interface do Administrador (Frontend)
- **`src/routes/_authenticated/admin.tsx`**:
    - Adicionar um campo de entrada de data e hora (`datetime-local`) para configurar o fechamento da rodada na criação/edição.
    - Exibir a data de fechamento atual nos detalhes da rodada.

## 4. Interface do Usuário (Frontend)
- **Nova Rota `src/routes/_authenticated/meus-palpites.tsx`**:
    - Exibir uma lista dos palpites realizados.
    - Implementar a visualização dos jogos com campos bloqueados (leitura).
    - Adicionar um botão "Editar Palpites" que redireciona para a tela de palpitar, visível apenas se a rodada estiver aberta (mesma lógica de data/status).
- **Ajuste em `src/routes/_authenticated/palpitar.tsx`**:
    - Redirecionar para "Meus Palpites" após salvar com sucesso.

## Detalhes Técnicos
- Utilizar componentes do `shadcn/ui` (`Label`, `Input`, `Card`, etc) para manter a consistência visual.
- A validação de fechamento será feita no servidor para garantir segurança.
- A sincronização de horário utilizará o tempo do banco de dados/servidor.
