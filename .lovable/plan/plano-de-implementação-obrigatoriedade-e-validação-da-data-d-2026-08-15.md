# Plano de Implementação: Obrigatoriedade e Validação da Data de Fechamento

O objetivo deste plano é tornar obrigatória a definição da data e hora de fechamento da rodada no painel administrativo e garantir que o sistema utilize esse valor para encerrar automaticamente a aceitação de palpites.

## Alterações

### 1. Banco de Dados (Supabase)
- **rounds**: Nenhuma alteração estrutural necessária, a coluna `closes_at` (timestamp) já existe.

### 2. Backend (TanStack Server Functions)
- **src/lib/admin.functions.ts**:
    - Atualizar `adminCreateRound` e `adminSaveMatches` para validar a presença de `closesAt` e torná-lo obrigatório no `zod` schema.
    - Garantir que a persistência no banco de dados reflita a obrigatoriedade.

### 3. Frontend Administrativo
- **src/routes/_authenticated/admin.tsx**:
    - Marcar o campo "Fecha em" como obrigatório na interface visual.
    - Adicionar validação no lado do cliente para impedir a criação ou salvamento da rodada sem a data de fechamento.
    - Exibir avisos claros ao administrador sobre a necessidade deste campo.

### 4. Frontend do Usuário
- **src/routes/_authenticated/palpitar.tsx**:
    - Refinar a lógica de `isClosed` para garantir que o fechamento baseado em `closes_at` seja respeitado de forma robusta.
    - O sistema já possui lógica para desabilitar inputs baseada no tempo, mas será reforçada para garantir consistência.

## Verificação
- Tentar criar uma rodada sem data de fechamento e confirmar que o sistema impede a ação.
- Criar uma rodada com fechamento no futuro e verificar se o acesso aos palpites está aberto.
- Simular ou aguardar o horário de fechamento e verificar se a tela de palpites fica inativa automaticamente.
