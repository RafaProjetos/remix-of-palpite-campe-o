# Plano de Ajuste de Layout dos Escudos e Nomes dos Times

Ajustar a exibição dos times nos jogos para que os escudos fiquem centralizados (próximos ao placar) e os nomes fiquem nas extremidades em telas grandes, removendo os nomes em telas móveis.

## Alterações

### 1. Componente de Times
- **Arquivo**: `src/components/team-badge.tsx`
- **Mudanças**:
    - Adicionar prop `position` ('home' ou 'away') para controlar a ordem dos elementos.
    - Ocultar o nome do time em telas móveis (`hidden sm:inline`).
    - Ajustar o layout flexível para inverter a ordem no time da casa (`flex-row-reverse` para 'home').
    - Garantir que o escudo seja o elemento mais próximo ao centro.

### 2. Tela Inicial (Página de Vendas/Acompanhamento)
- **Arquivo**: `src/routes/index.tsx`
- **Mudanças**:
    - Passar `position="home"` para o `TeamBadge` do time da casa.
    - Passar `position="away"` para o `TeamBadge` do time visitante.
    - Ajustar o alinhamento do grid para que os elementos de "casa" encostem na direita e os de "fora" na esquerda.

### 3. Tela de Palpites
- **Arquivo**: `src/routes/_authenticated/palpitar.tsx`
- **Mudanças**:
    - Aplicar a mesma lógica de `position` e alinhamento do grid para manter a consistência visual.

## Detalhes Técnicos
- Utilizar classes utilitárias do Tailwind CSS:
    - `flex-row-reverse` para inverter nome/escudo no time da casa.
    - `hidden sm:inline` ou `hidden sm:block` para controlar a visibilidade do nome.
    - `justify-end` no container do time da casa para alinhar ao centro (direita da célula 1fr).
    - `justify-start` no container do time visitante para alinhar ao centro (esquerda da célula 1fr).
