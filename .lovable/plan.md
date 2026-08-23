# Plano de Refatoração da Seção "Escolha sua Liga"

Melhorar o design da seção de seleção de ligas na página inicial e na página de palpites, adotando um estilo de "vitrine de produtos" com badges promocionais e apelo visual elevado.

## Alterações

### 1. Componente de League Cards (index.tsx)
- Refatorar a grade de ligas para usar cards mais robustos e visualmente atraentes.
- Adicionar badges promocionais:
  - **Liga Bronze**: Etiqueta "Mais Popular".
  - **Liga Ouro**: Etiqueta "Mais Vantajoso".
- Aprimorar o estilo dos cards (sombras, bordas, cores de fundo suaves).
- Incluir lista de benefícios em cada liga para reforçar o valor.

### 2. Componente de Seleção de Ligas (palpitar.tsx)
- Atualizar os cards de resumo de métricas (Pote, Participantes, Custo) para manter a consistência visual.
- Adicionar as mesmas etiquetas promocionais na interface de abas (Tabs) ou nos cards informativos.

## Detalhes Técnicos
- Utilizar componentes do shadcn/ui (`Card`, `Badge`, `Button`) com variantes customizadas.
- Aplicar gradientes sutis e efeitos de `hover` para interatividade.
- Garantir responsividade total (1 coluna em mobile, 2 em tablet, 4 em desktop).
- As etiquetas serão posicionadas de forma absoluta no topo dos cards.

## Revisão Visual
- **Free**: Tom cinza/ardósia, focado em diversão.
- **Bronze**: Tom laranja/bronze, destaque "Mais Popular".
- **Prata**: Tom prata/azul, focado em competitividade.
- **Ouro**: Tom dourado/amarelo, destaque "Mais Vantajoso" e efeito de escala.
