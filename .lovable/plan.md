# Plano de Reformulação da Home

Transformar a página inicial em uma vitrine profissional e persuasiva, destacando as ligas, prêmios e a dinâmica competitiva do Brasileirão 2026.

## Alterações Propostas

### 1. Novo Hero Section (Persuasão e CTA)
- **Visual:** Manter o gradiente `primary` para `secondary`, mas com um layout mais limpo e tipografia impactante.
- **Copy:** 
    - Heading: "Transforme seus palpites em prêmios reais."
    - Subhead: "Participe do maior bolão do Brasileirão 2026. Escolha sua liga, crave os placares e dispute o topo do ranking com milhares de torcedores."
- **CTAs:** Botão principal "Começar a Palpitar" com destaque e botão secundário "Ver Ligas e Prêmios".

### 2. Seção de Métricas e Prova Social
- Exibir cards modernos para as métricas:
    - **Total no Pote:** Soma dinâmica do pote líquido das ligas pagas.
    - **Participantes Ativos:** Número total de usuários na rodada atual.
    - **Premiação Máxima:** Destaque para o prêmio do 1º lugar da Liga Ouro.

### 3. Vitrine das Ligas (Segmentação)
- Criar uma nova seção visual com cards comparativos para as ligas:
    - **Liga Free:** "Treine seus palpites e suba no ranking global."
    - **Liga Bronze (R$ 5):** "Entrada acessível, prêmios reais."
    - **Liga Prata (R$ 20):** "O equilíbrio ideal entre risco e recompensa."
    - **Liga Ouro (R$ 50):** "Para os especialistas. Pote exclusivo e premiação alta."

### 4. Resumo da Rodada e Ranking em Tempo Real
- **Jogos:** Refatorar a lista de jogos para um grid mais responsivo (2 colunas em mobile, se possível, ou cards mais compactos).
- **Ranking:** Adicionar um seletor rápido (tabs) para ver o Top 3 de cada liga diretamente na home, aumentando o senso de competição.

### 5. Rodapé e Confiança
- Adicionar selos de segurança (Pagamento Seguro via Mercado Pago, LGPD).

## Detalhes Técnicos
- **Arquivo:** `src/routes/index.tsx`
- **Componentes shadcn:** Utilizar `Card`, `Badge`, `Button`, `Tabs` (para o ranking).
- **Responsividade:** Uso intensivo de classes utilitárias do Tailwind (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`, `hidden sm:block`, etc.).
- **Dados:** Aproveitar o loader existente `getCurrentRound()` e a query de rankings, mas filtrar/formatar melhor na UI.
