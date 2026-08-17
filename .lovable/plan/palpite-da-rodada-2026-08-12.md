# Palpite da Rodada

App de bolão da rodada do Campeonato Brasileiro: cadastro, palpites nos 10 jogos, pagamento de R$ 50 via Mercado Pago, ranking em tempo real e painel do administrador.

Identidade visual: verde, amarelo e azul (paleta brasileira), tipografia esportiva, escudos dos times em destaque.

## Backend (Lovable Cloud)

Ativo o Lovable Cloud para contas, banco e lógica de servidor.

Tabelas:
- `profiles` — nome, e-mail, telefone, aceite do regulamento (data/hora).
- `user_roles` — papéis (`admin`, `user`) em tabela separada por segurança. Conta ADM criada com papel admin.
- `rounds` — rodada, status (aberta / encerrada / validada), valor da aposta (R$ 50), limite de 100 apostadores.
- `matches` — 10 jogos por rodada: times, escudos, data, placar real.
- `bets` — aposta de um usuário numa rodada, status do pagamento, pontuação total.
- `bet_picks` — placar palpitado em cada jogo.
- `payments` — registro Mercado Pago (preference id, payment id, status, valor).

Regras de acesso: cada usuário só lê/escreve os próprios palpites; palpites de terceiros ficam ocultos até a rodada encerrar; admin enxerga tudo.

## Jogos e escudos

- Integração com API-Football para importar a rodada atual (times, escudos, data/hora) e depois os placares reais.
- Você fornece a chave da API-Football quando eu pedir (formulário seguro).
- Fallback manual: no painel admin dá para criar/editar os 10 jogos e escudos à mão, caso a API falhe ou você prefira.

## Fluxo do usuário

1. Cadastro (e-mail e senha) e login.
2. Tela de regulamento logo após o cadastro: precisa marcar ciência das regras e autorizar o uso dos dados restritamente dentro do app. Sem aceite, não palpita.
3. Tela da rodada: 10 jogos com escudos, campos de placar para mandante e visitante.
4. Revisão do palpite e pagamento de R$ 50 via Mercado Pago (Checkout Pro). A aposta só é confirmada quando o pagamento é aprovado.
5. Bloqueio automático ao atingir 100 apostadores pagantes na rodada.
6. Painéis de ranking: ranking da rodada (atualiza conforme os resultados são validados) e ranking geral acumulado de todas as rodadas jogadas.

## Pagamento

- Mercado Pago Checkout Pro, R$ 50 por aposta.
- Começamos com credenciais de **teste**, conforme você pediu; a troca para produção é só substituir o token depois.
- O access token fica guardado como segredo do servidor, nunca no código nem no navegador.
- Webhook do Mercado Pago confirma o pagamento e libera a aposta; sem confirmação, o palpite fica pendente.

## Painel do administrador

Login com a conta ADM (papel admin no banco).

- Lista clicável de participantes pagantes da rodada; ao clicar, vejo todos os palpites daquela pessoa.
- Painel com total arrecadado na rodada e contagem de pagantes (x/100).
- Área "Validador": os jogos aparecem opacos e inacessíveis até eu escolher uma das duas opções:
  - botão "Buscar resultados via API" (API-Football), ou
  - botão "Inserir resultados manualmente".
  Depois da escolha, os jogos ficam editáveis/visíveis e eu confirmo a validação, que dispara o cálculo dos pontos.
- Gestão da rodada: importar/editar jogos, abrir e encerrar a rodada.

## Pontuação (por jogo, cumulativa conforme as regras)

- Placar exato: 30 pontos
- Acertou só o vencedor (sem o placar): 10 pontos
- Palpitou empate e saiu empate com outro placar: 15 pontos
- Acertou o placar de apenas um dos times: 5 pontos
- Acertou a diferença de gols: 5 pontos

Soma de todos os jogos define o ranking da rodada; quem tem mais pontos vence. Toda rodada jogada soma no ranking geral (prêmio extra no fim da competição).

## Detalhes técnicos

- TanStack Start + Lovable Cloud (Postgres + Auth), RLS em todas as tabelas.
- Cálculo de pontuação em função de servidor, disparada pela validação do admin — nunca no navegador.
- Chamadas à API-Football e ao Mercado Pago apenas no servidor, com as chaves em segredos.
- Webhook do Mercado Pago em rota pública com validação da assinatura.
- Limite de 100 pagantes garantido no servidor (verificação transacional).
