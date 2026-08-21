# Plano de Refatoração de Responsividade e Ajustes Visuais

Melhorar a responsividade do site em todos os dispositivos, ajustando o tamanho das fontes e dos elementos (escudos e nomes dos times) para garantir que o conteúdo caiba perfeitamente em telas menores, mantendo um visual profissional.

## Alterações

### Componente de Escudos e Nomes (`TeamBadge`)
- Ajustar os tamanhos base no componente `TeamBadge` para serem mais flexíveis.
- Diminuir o tamanho das fontes e dos ícones em telas pequenas (mobile).
- Garantir que o nome do time use `truncate` corretamente para não quebrar o layout.

### Tela Inicial (`index.tsx`)
- Reduzir o tamanho dos títulos (H1) em dispositivos móveis.
- Ajustar o padding e as margens das seções para aproveitar melhor o espaço em telas estreitas.
- Diminuir o tamanho das fontes nos cards de métricas e na vitrine de ligas para mobile.
- Ajustar a grade de jogos para que os nomes dos times não fiquem sobrepostos.

### Tela de Palpites (`palpitar.tsx`)
- Refinar o layout dos cards de confronto.
- Diminuir os inputs de placar em mobile para dar mais espaço aos nomes dos times.
- Ajustar o tamanho da fonte das datas e horários dos jogos.

### Tela de Ranking (`ranking.tsx`)
- Otimizar a visualização da tabela em mobile, garantindo que as colunas essenciais caibam sem scroll horizontal excessivo.
- Ajustar o tamanho das medalhas/posições.

## Detalhes Técnicos
- Utilizar classes utilitárias do Tailwind CSS com modificadores de breakpoint (`sm:`, `md:`, `lg:`) para ajustes finos.
- Revisar o uso de `text-4xl`, `text-6xl` e afins, garantindo escalas menores em mobile (ex: `text-2xl sm:text-4xl`).
- Ajustar o `iconSize` e `textSize` no `TeamBadge` para valores mais conservadores em telas pequenas.
