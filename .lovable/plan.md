# Plano para Refatoração do Tom do Regulamento

Ajustar a linguagem da tela de Regulamento para um tom mais formal e profissional, removendo gírias e expressões excessivamente informais introduzidas anteriormente, mantendo a clareza para todos os usuários.

## Alterações Propostas

### 1. Refatoração de Texto no Frontend (`src/routes/regulamento.tsx`)

- **Seção "Como Funciona":**
    - Alterar o título de "Cola aqui: Como o jogo funciona" para "Funcionamento do Jogo".
    - Reescrever o texto de introdução para ser mais direto e profissional.
    - Ajustar a lista de características para usar uma linguagem descritiva e organizada.
- **Seção de Download:**
    - Ajustar a chamada para o download do PDF oficial para um tom informativo.
- **Seção de Dados e Privacidade:**
    - Alterar o título de "Seus dados estão em boas mãos!" para "Segurança e Privacidade de Dados".
    - Reescrever a explicação sobre o uso de dados, enfatizando a conformidade com a LGPD.
- **Interação do Usuário:**
    - Atualizar os labels de checkbox e o texto do botão de aceite para um tom de compromisso formal (ex: "Li e aceito os termos...").
    - Ajustar as mensagens de status (sucesso, logado, pendente) para serem mais neutras.

### 2. Metadados SEO

- Revisar as descrições de meta tags para garantir que o tom profissional comece desde a busca/compartilhamento.

## Detalhes Técnicos

- **Arquivo:** `src/routes/regulamento.tsx`
- **Componentes:** Atualização de strings estáticas dentro dos componentes `CardTitle`, `CardContent`, `Button` e labels.
- **SEO:** Atualização no bloco `head` da rota.
