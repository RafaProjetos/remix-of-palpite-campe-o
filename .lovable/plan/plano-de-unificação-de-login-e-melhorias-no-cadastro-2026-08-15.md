# Plano de Unificação de Login e Melhorias no Cadastro

O objetivo deste plano é unificar a interface de login para usuários e administradores, permitindo que o administrador utilize um nome de usuário ("ADM") em vez de e-mail, enquanto mantém a mesma senha. Além disso, o cadastro será atualizado para incluir o número de telefone com WhatsApp, e esta informação será disponibilizada no painel administrativo.

## Mudanças

### Frontend

- **Unificação da Tela de Login (`src/routes/entrar.tsx`)**:
  - Removidas as abas "Entrar", "Cadastrar" e "Admin". A tela agora exibirá apenas as opções "Entrar" e "Criar Conta" (como abas ou botões de alternância).
  - O formulário de login terá um campo "E-mail ou Usuário".
  - Se o valor inserido for "ADM" (case-insensitive), o sistema tentará realizar o login como administrador usando o e-mail técnico `adm@palpitedarodada.app`.
  - Caso contrário, tentará realizar o login normal via e-mail.
  - No formulário de cadastro, será adicionado o campo "Número com Whatsapp" (telefone celular).

- **Painel Administrativo (`src/routes/_authenticated/admin.tsx`)**:
  - O campo "Telefone" será exibido na listagem de participantes e incluído nas exportações (Excel/PDF) para facilitar a premiação.

### Backend

- **Função de Aceite de Termos e Perfil (`src/lib/palpite.functions.ts`)**:
  - Atualizada a função `acceptTerms` para garantir que o campo `phone` seja processado corretamente.
  - Atualizado o `signUp` no frontend para passar o telefone nos metadados ou via `acceptTerms` imediatamente após o cadastro.

- **Esquema do Banco de Dados**:
  - O campo `phone` já existe na tabela `public.profiles`, então não são necessárias migrações de esquema, apenas garantir seu uso consistente.

## Detalhes Técnicos

- A lógica de login distinguirá `ADM` de um e-mail padrão.
- O campo de telefone terá o rótulo "Número com Whatsapp" conforme solicitado.
- As exportações administrativas já possuem o campo `phone`, mas garantiremos que ele esteja preenchido e visível.

## Verificação

1. Testar login com e-mail de usuário comum.
2. Testar login com "ADM" e a senha administrativa.
3. Realizar um novo cadastro preenchendo o número de WhatsApp e verificar se os dados persistem.
4. Acessar o painel admin e verificar se o número do novo usuário aparece na lista e nas exportações.
