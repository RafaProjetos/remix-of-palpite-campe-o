# Plano de Implementação - Autenticação e Regulamento

Este plano detalha as alterações para remover a obrigatoriedade de confirmação de e-mail no cadastro, ajustar o fluxo de aceite do regulamento e adicionar ferramentas de exportação para o administrador.

## Alterações Sugeridas

### 1. Autenticação e Cadastro
- Alterar `src/routes/entrar.tsx` para usar `email_confirm: false` (ou equivalente) e ajustar o redirecionamento.
- Modificar o fluxo de cadastro para que, após o sucesso, o usuário seja redirecionado para a tela de regulamento logado.
- Garantir que a recuperação de senha continue enviando e-mails.

### 2. Regulamento e Aceite
- Adicionar o botão "Aceito os termos do regulamento" na tela `src/routes/regulamento.tsx`.
- Esse botão chamará a função `acceptTerms` e, após o sucesso, redirecionará para a tela de palpites.
- A tela de regulamento será o destino obrigatório após o primeiro login se o usuário ainda não tiver aceitado os termos.

### 3. Painel Administrativo e Exportação
- Adicionar botões no painel admin (`src/routes/_authenticated/admin.tsx`) para baixar a lista de participantes em **Excel** e **PDF**.
- Incluir a informação de "Aceite do Regulamento" na lista de participantes visível para o administrador.
- Implementar a lógica de geração de arquivos usando bibliotecas como `xlsx` e `jspdf` (via `bun add`).

### 4. Banco de Dados
- Nenhuma alteração estrutural necessária, pois as colunas `terms_accepted_at` e `email` já existem na tabela `profiles`.

## Detalhes Técnicos
- Utilizar `supabase.auth.updateUser` ou `signUp` com configurações que ignorem a confirmação imediata (dependendo das limitações da biblioteca cliente).
- Integrar `xlsx` para exportação de dados tabulares.
- Integrar `jspdf` e `jspdf-autotable` para geração de relatórios PDF.
