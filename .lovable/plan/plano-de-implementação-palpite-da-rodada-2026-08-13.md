# Plano de Implementação - Palpite da Rodada

O sistema "Palpite da Rodada" está em fase avançada de desenvolvimento. As principais funcionalidades de backend, banco de dados e integração com APIs (API-Football e Mercado Pago) já foram estruturadas. Este plano foca na finalização das interfaces e na garantia de que o fluxo do usuário e do administrador esteja coeso.

## Alterações Propostas

### 1. Backend e Integrações (Finalização)
- Garantir que as funções em `src/lib/admin.functions.ts` e `src/lib/palpite.functions.ts` estejam totalmente integradas com os componentes de UI.
- Validar o fluxo de processamento de webhooks do Mercado Pago para atualização automática do status das apostas.

### 2. Interface do Usuário (Usuário Final)
- **Tela de Palpites (`src/routes/_authenticated/palpitar.tsx`)**: Refinar a interface para garantir que o usuário veja os escudos dos times e os campos de placar de forma clara. Adicionar validação para garantir que todos os 10 jogos sejam preenchidos.
- **Fluxo de Pagamento**: Garantir que, após o palpite, o usuário seja redirecionado corretamente para o Checkout Pro do Mercado Pago e retorne para a tela de confirmação.
- **Ranking (`src/routes/ranking.tsx`)**: Finalizar a exibição do ranking da rodada e do ranking geral, garantindo que os dados sejam atualizados em tempo real conforme a rodada é validada.

### 3. Painel Administrativo (`src/routes/_authenticated/admin.tsx`)
- **Gestão de Rodadas**: Permitir a criação de novas rodadas importando dados da API-Football ou manualmente.
- **Validador**: Implementar a lógica visual para buscar resultados reais via API ou inserção manual, seguida do cálculo automático de pontos para todos os participantes.
- **Lista de Participantes**: Exibir de forma clara quem pagou, permitindo ao admin visualizar os palpites individuais e marcar pagamentos manuais se necessário.

## Detalhes Técnicos

### Estrutura de Pastas e Arquivos
- `src/lib/palpite.server.ts`: Lógica de baixo nível para APIs externas.
- `src/lib/palpite.functions.ts`: Funções de servidor (RPC) para ações do usuário.
- `src/lib/admin.functions.ts`: Funções de servidor (RPC) restritas ao administrador.
- `src/routes/_authenticated/`: Rotas protegidas que exigem login e, em alguns casos, aceite do regulamento ou papel de admin.

### Segurança e Permissões
- Uso de RLS (Row Level Security) no Supabase para proteger os dados.
- Função `has_role` para validar o acesso administrativo no backend.
- Middleware `requireSupabaseAuth` em todas as funções sensíveis.

## Próximos Passos
1. Finalizar a UI da tela de palpites e administração.
2. Realizar testes de ponta a ponta com o ambiente de testes do Mercado Pago.
3. Configurar as chaves de API necessárias (`API_FOOTBALL_KEY` e `MERCADOPAGO_ACCESS_TOKEN`).
