# Plano - Acompanhamento de Pontuação em Tempo Real

O objetivo é permitir que o usuário acompanhe sua pontuação (por jogo e total) na tela "Meus Palpites" após o início da rodada, exibindo os pontos conquistados em cada palpite e a soma geral.

## Alterações

### 1. Servidor e Funções
- Nenhuma alteração no banco de dados é necessária, pois a tabela `bet_picks` já possui a coluna `points` e `bets` possui `total_points`.
- Atualizar `src/lib/palpite.functions.ts`:
    - Garantir que `getMyBet` retorne os pontos de cada `bet_pick` e o total da aposta (`bets.total_points`).
    - Modificar `getCurrentRound` para incluir o status atual dos jogos (placar real).

### 2. Interface de Usuário (Frontend)
- Atualizar `src/routes/_authenticated/meus-palpites.tsx`:
    - Exibir o placar real do jogo (se disponível) ao lado do palpite do usuário.
    - Mostrar a pontuação obtida em cada jogo (ex: "+3 pts").
    - Adicionar um resumo no topo ou rodapé com a pontuação total da rodada.
    - Adicionar indicadores visuais (badges ou cores) para palpites que acertaram o placar (ex: 3 pontos) ou o vencedor (ex: 1 ponto).

## Detalhes Técnicos
- Utilizar a coluna `points` da tabela `bet_picks` (preenchida pela função `validate_round` no banco).
- A interface deve diferenciar jogos que ainda não começaram, jogos em andamento e jogos encerrados.
- Responsividade mantida: os pontos serão exibidos de forma compacta em telas menores.

## Verificação
- Testar a visualização com uma aposta que possua pontos calculados.
- Validar se a pontuação total corresponde à soma dos pontos individuais.
- Verificar se os placares reais dos jogos aparecem corretamente quando a rodada está em andamento/encerrada.
