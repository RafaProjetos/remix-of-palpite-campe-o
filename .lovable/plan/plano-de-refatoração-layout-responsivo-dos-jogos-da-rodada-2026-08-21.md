# Plano de Refatoração: Layout Responsivo dos Jogos da Rodada

O objetivo é ajustar a seção de jogos na Home e na tela de Palpites para que os escudos fiquem em cima dos nomes em telas maiores, e apenas os escudos apareçam em celulares, garantindo uma apresentação limpa e profissional.

## Alterações Técnicas

### 1. Componente `TeamBadge`
- Adicionar uma nova prop `layout` que aceite `"horizontal"` (padrão atual) ou `"vertical"`.
- No modo `vertical`, os escudos ficarão centralizados acima do texto.
- Implementar classes Tailwind para ocultar o nome do time em dispositivos móveis (`hidden sm:block`) quando solicitado via prop ou contexto.

### 2. Página Inicial (`src/routes/index.tsx`)
- Atualizar a listagem de `matches` para usar o `layout="vertical"` no `TeamBadge`.
- Ajustar o grid para suportar a nova orientação, garantindo que os escudos fiquem em cima e os nomes embaixo.
- Aplicar a regra de ocultar os nomes em dispositivos móveis para manter apenas os escudos alinhados.

### 3. Tela de Palpites (`src/routes/_authenticated/palpitar.tsx`)
- Aplicar lógica similar à da Home para os cards de jogos.
- Otimizar o espaço entre os escudos e os inputs de placar para evitar transbordamento horizontal.

## Passos de Execução

1.  **Modificar `src/components/team-badge.tsx`**:
    - Adicionar prop `layout?: "horizontal" | "vertical"`.
    - Adicionar prop `hideNameOnMobile?: boolean`.
    - Refatorar o JSX para condicionalmente renderizar o layout em coluna ou linha.

2.  **Modificar `src/routes/index.tsx`**:
    - Ajustar a estrutura flex/grid dentro do map de matches.
    - Passar as novas props para o `TeamBadge`.

3.  **Modificar `src/routes/_authenticated/palpitar.tsx`**:
    - Sincronizar o layout com a nova proposta visual.

4.  **Validação**:
    - Testar em desktop, tablet e mobile (375px) via Playwright.
