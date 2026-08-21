# Plano de Simplificação da Tela de Regulamento

Remover a obrigatoriedade e a exibição dos campos de Nome e Telefone na tela de regulamento, mantendo apenas o aceite dos termos e a autorização de uso de dados.

## Alterações Propostas

### Frontend (`src/routes/regulamento.tsx`)
- Remover os campos de entrada (`Input`) para `nome` e `telefone`.
- Remover os estados `nome` e `telefone` do componente.
- Ajustar a função `confirmar` para não enviar mais esses dados, ou enviar valores vazios/nulos se a função de servidor ainda os exigir.
- Manter o checkbox de aceite e o botão de confirmação.

### Backend (`src/lib/palpite.functions.ts`)
- Atualizar a `createServerFn` `acceptTerms`:
    - Modificar o `inputValidator` para tornar `fullName` opcional ou removê-lo completamente.
    - Ajustar o handler para atualizar apenas `terms_accepted_at` (e `full_name`/`phone` apenas se fornecidos).

## Detalhes Técnicos
- O banco de dados já possui esses campos, mas como o usuário informou que eles já são coletados no cadastro, não há necessidade de coletá-los novamente aqui.
- A validação do Zod em `acceptTerms` será afrouxada para permitir chamadas sem os campos de texto.
