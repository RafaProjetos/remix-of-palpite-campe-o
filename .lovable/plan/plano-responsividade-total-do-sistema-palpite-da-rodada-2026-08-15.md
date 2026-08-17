# Plano: Responsividade Total do Sistema "Palpite da Rodada"

O objetivo é garantir que todas as telas do aplicativo sejam totalmente responsivas, funcionando perfeitamente em dispositivos móveis, tablets e desktops.

## Alterações de UI

### Global
- Ajustar o `SiteHeader` para usar um menu móvel (hambúrguer) em telas pequenas, evitando a sobreposição de itens de navegação.
- Garantir que o container principal em todas as rotas tenha preenchimento (padding) adequado em telas pequenas.

### Home (`/`)
- Ajustar a seção Hero para empilhar elementos verticalmente em telas móveis.
- Melhorar a grade de jogos para exibir escudos e nomes de forma legível em telas estreitas, possivelmente reduzindo o tamanho da fonte ou ajustando o layout para uma coluna quando necessário.
- Transformar o grid principal de 3 colunas em 1 coluna no mobile.

### Palpitar (`/_authenticated/palpitar`)
- Otimizar o formulário de palpites: garantir que os inputs de placar e os nomes dos times não quebrem o layout em telas muito pequenas (ex: iPhone SE).
- Ajustar botões de ação para ocuparem a largura total no mobile para facilitar o toque.

### Admin (`/_authenticated/admin`)
- Converter tabelas ou listas horizontais em cartões verticais no mobile.
- Ajustar o grid de métricas (arrecadação, participantes) para 1 coluna no mobile.
- Otimizar o formulário de edição de partidas, que atualmente é denso e difícil de usar em telas pequenas.

### Ranking e Outras
- Garantir que as listas de ranking e textos do regulamento quebrem corretamente e mantenham a legibilidade.

## Detalhes Técnicos

- Utilizar classes utilitárias do Tailwind CSS como `sm:`, `md:`, `lg:` para controle refinado.
- Implementar um componente `MobileNav` no `SiteHeader`.
- Revisar o uso de `grid-cols-[1fr_auto_1fr]` em componentes de partidas para garantir que o conteúdo central (placar) não seja espremido.
- Adicionar `overflow-x-auto` em áreas que contenham dados tabulares.
