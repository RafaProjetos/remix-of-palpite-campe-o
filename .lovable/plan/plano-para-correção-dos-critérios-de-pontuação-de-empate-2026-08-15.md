# Plano para correção dos critérios de pontuação de empate

O objetivo é ajustar a regra de pontuação para casos em que o usuário palpita um empate, o jogo não termina em empate, mas o usuário acerta o número de gols de um dos times (placar simples).

## Alterações Sugeridas

### Banco de Dados (SQL)

- Atualizar a função `public.compute_pick_points`:
  - Modificar a lógica para que, se o usuário palpitou empate (`p_home = p_away`) e o jogo não terminou em empate (`r_home != r_away`), ele ainda possa receber os 5 pontos de acerto de placar simples caso `p_home = r_home` ou `p_away = r_away`.
  - Atualmente, a função entra no bloco de vitória/derrota (seção 3) e só pontua se a tendência estiver correta ou se houver acerto de gols. Como palpites de empate nunca terão a mesma tendência que uma vitória/derrota, os pontos de acerto de gols precisam ser garantidos mesmo fora do bloco de tendência.

### Verificação

- Após a migração, rodar um recálculo para as rodadas afetadas.

## Detalhes Técnicos

A função `compute_pick_points` será ajustada da seguinte forma:
1. Placar exato (30 pts) - Mantém.
2. Jogo terminou em empate (r_home = r_away):
   - Usuário palpitou empate: 15 pts (fixo) - Mantém.
   - Usuário NÃO palpitou empate: Acerto de gols de um time (5 pts) - Mantém.
3. Jogo NÃO terminou em empate (r_home != r_away):
   - Usuário palpitou vitória/derrota na tendência correta: 10 pts + Saldo (2 pts) + Acerto gols (5 pts).
   - Usuário palpitou empate OU tendência errada: Acerto gols (5 pts).

O ajuste garantirá que `pts := pts + 5` ocorra sempre que `p_home = r_home OR p_away = r_away`, independentemente de tendência ou empate, desde que não seja placar exato ou empate fixo de 15 pontos.
