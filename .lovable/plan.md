# Plano de Integração: Página de Palpites com API de Futebol

Integrar a página de palpites (`src/routes/_authenticated/palpitar.tsx`) com a API de futebol através do endpoint `/api/public/get-fixtures` para exibir jogos reais, escudos e horários atualizados.

## Alterações Propostas

### Backend / API
- Utilizar o endpoint já criado `src/routes/api/public/get-fixtures.ts` para buscar os jogos da rodada atual do Brasileirão.

### Frontend (`src/routes/_authenticated/palpitar.tsx`)
- **Carregamento de Dados**: Adicionar um `useQuery` para buscar os dados de `/api/public/get-fixtures`.
- **Interface de Usuário**:
    - Atualizar a lista de jogos para usar os dados vindos da API (nomes dos times, escudos, data e horário).
    - Exibir a data e o horário formatados para cada partida.
    - Manter os campos de entrada de placar (`Input`) e a lógica de salvamento.
- **Estado Local**: Sincronizar os IDs das partidas da API com o estado de palpites do usuário.

## Detalhes Técnicos

- **Fetcher**: Criar uma função auxiliar no frontend para realizar o `fetch` do endpoint `/api/public/get-fixtures`.
- **Formatação**: Usar `Intl.DateTimeFormat` para exibir as datas dos jogos no padrão brasileiro.
- **Componentes**: 
    - Continuar usando o componente `TeamBadge` para consistência visual.
    - Adicionar um rótulo de data/hora entre ou abaixo dos escudos dos times.

## Considerações de Segurança e Performance
- O endpoint de fixtures já está sob `/api/public/`, permitindo acesso direto do cliente sem expor chaves de API sensíveis (que ficam no servidor).
- Implementar estado de carregamento (`LoadingSkeleton` ou spinner) enquanto os dados da API são buscados.
