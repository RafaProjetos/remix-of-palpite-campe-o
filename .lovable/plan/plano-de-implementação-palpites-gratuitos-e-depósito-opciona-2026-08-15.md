# Plano de Implementação: Palpites Gratuitos e Depósito Opcional

O objetivo é transformar o sistema de palpites obrigatórios em um sistema híbrido: palpites gratuitos para todos, com a opção de "ganhar com seu palpite" através de um depósito de R$ 50,00 (limitado a 100 participantes pagantes por rodada).

## Alterações no Banco de Dados

- Nenhuma alteração estrutural imediata é estritamente necessária nas tabelas, mas a lógica de validação de `status` nas apostas será ajustada.
- O campo `status` na tabela `bets` continuará sendo `pending` para gratuitos e mudará para `paid` após o pagamento.

## Lógica do Servidor (`src/lib/palpite.functions.ts`)

- **`saveBet`**:
    - Remover a obrigatoriedade de pagamento para salvar os palpites.
    - O palpite será salvo com `status: 'pending'` se ainda não existir.
    - Se o usuário já pagou (`status: 'paid'`), ele ainda pode alterar os palpites? (O usuário não especificou, mas geralmente palpites pagos são bloqueados ou permitidos até o início da rodada. Manterei o bloqueio atual de `paid` para simplificar, a menos que solicitado o contrário).
- **`startPayment`**:
    - Validar o limite de 100 participantes pagantes antes de iniciar o checkout.

## Interface do Usuário (`src/routes/_authenticated/palpitar.tsx`)

- Mudar o botão principal de "Confirmar e pagar" para "Salvar palpites gratuitos".
- Adicionar um novo componente de Call to Action (CTA) "Ganhe com seu Palpite":
    - Este CTA oferecerá a opção de depósito de R$ 50,00.
    - Exibir a contagem de vagas restantes (Ex: "85/100 vagas disponíveis").
    - Se as 100 vagas estiverem preenchidas, exibir a mensagem de que não há mais vagas para esta rodada.
- Atualizar os Badges e feedbacks visuais para diferenciar "Palpite Gratuito" de "Participando do Prêmio (Pago)".

## Detalhes Técnicos

- A função `round_stats` (RPC) já retorna o `paid_count`, que será usado para validar o limite de 100.
- O sistema de pontuação e ranking já funciona para todos os palpites, independentemente do status de pagamento.

## Passos

1. Modificar `saveBet` em `src/lib/palpite.functions.ts` para permitir salvar sem pagar.
2. Modificar `Palpitar` em `src/routes/_authenticated/palpitar.tsx` para incluir o CTA e separar as ações.
3. Validar o fluxo de "Ganhar com seu Palpite" com o limite de 100 usuários.
