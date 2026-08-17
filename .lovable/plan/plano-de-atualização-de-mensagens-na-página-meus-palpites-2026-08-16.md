# Plano de atualização de mensagens na página "Meus Palpites"

O objetivo é atualizar as mensagens de status da rodada na página "Meus Palpites" para refletir com mais precisão o estado dos palpites (se estão abertos ou encerrados).

## Alterações

### Frontend

- **Arquivo `src/routes/_authenticated/meus-palpites.tsx`**
    - Localizar o componente `Badge` que exibe o status da rodada (atualmente "Rodada Fechada" ou "Rodada Aberta").
    - Alterar o texto exibido quando `isClosed` for verdadeiro para "Palpites encerrados".
    - Manter a lógica condicional existente para as outras situações.

## Detalhes técnicos

- A variável `isClosed` já está definida no componente e considera tanto o status da rodada quanto a data de fechamento (`closes_at`).
- A alteração será feita diretamente no JSX do componente `MeusPalpites`.
