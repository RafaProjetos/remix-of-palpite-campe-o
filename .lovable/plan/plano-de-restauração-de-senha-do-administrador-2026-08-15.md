# Plano de Restauração de Senha do Administrador

Este plano descreve as etapas para garantir que o administrador possa acessar o painel usando o identificador "ADM" e a senha "#010101".

## Alterações

### Backend (Server Functions)

- **src/lib/palpite.functions.ts**:
    - Atualizar a função `ensureAdminAccount` para garantir que, se a conta já existir, a senha seja redefinida para `#010101` caso necessário (ou simplesmente garantir que a criação use essa senha).
    - Adicionar lógica para atualizar a senha do usuário administrador caso ele já exista, usando `supabaseAdmin.auth.admin.updateUserById`.

### Frontend

- **src/routes/entrar.tsx**:
    - Confirmar que a função `entrarAdmin` chama `ensureAdminAccount` antes de tentar o login, garantindo que a conta e a senha estejam sincronizadas.
    - Garantir que o valor digitado "ADM" no campo de identificador acione corretamente o fluxo de login administrativo com a senha fornecida pelo usuário na tela.

## Detalhes Técnicos

- A conta administrativa é identificada internamente pelo e-mail `adm@palpitedarodada.app`.
- O uso da *service role* (via `supabaseAdmin`) no servidor permite a gestão da conta sem depender de sessão prévia.

## Verificação

1. Tentar logar com "ADM" e a senha "#010101" na tela de login.
2. Confirmar redirecionamento para o painel `/admin`.
