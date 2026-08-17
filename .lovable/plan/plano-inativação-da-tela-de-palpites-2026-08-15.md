# Plano: Inativação da Tela de Palpites

O objetivo é impedir que os usuários acessem a funcionalidade de "palpitar" quando o prazo da rodada atual expirar ou o status for diferente de "aberto".

## Alterações

### 1. Funções de Servidor
- Nenhuma alteração estrutural necessária em `src/lib/palpite.functions.ts` ou `src/lib/palpite.server.ts`, pois a verificação de `closes_at` e `status` já existe no `saveBet`. No entanto, vamos garantir que `getCurrentRound` retorne informações suficientes para o frontend decidir o estado da UI.

### 2. Componente de Cabeçalho (`src/components/site-header.tsx`)
- Modificar o link "Palpitar" para ser visualmente desabilitado ou oculto quando não houver rodada aberta.
- Como o `SiteHeader` é um componente compartilhado que não deve carregar dados pesados em cada renderização, adicionaremos uma verificação leve ou apenas trataremos a navegação/exibição na página de destino.
- **Decisão**: Manter o link, mas aplicar a lógica de bloqueio na rota `/palpitar`.

### 3. Tela de Palpites (`src/routes/_authenticated/palpitar.tsx`)
- Implementar verificação de `rodada.data?.round?.status` e `rodada.data?.round?.closes_at`.
- Se a rodada estiver fechada (`status !== 'open'`) ou o horário limite tiver passado, exibir uma mensagem clara de "Palpites Encerrados" e desabilitar todos os campos de input e botões.
- Impedir que o usuário tente salvar mesmo que consiga burlar o CSS (adicionar trava no componente).

### 4. Middleware de Rota (Opcional mas recomendado)
- Adicionar um redirecionamento automático ou estado de erro na própria rota se tentarem acessar `/palpitar` fora do prazo.

## Detalhes Técnicos
- Lógica de fechamento: `isClosed = status !== 'open' || (closes_at && new Date(closes_at) < new Date())`.
- UI: Substituir o formulário de placares por um alerta ou overlay informativo quando `isClosed` for verdadeiro.

## Verificação
- Testar alterando a data de fechamento no banco via Admin.
- Verificar se a mensagem de rodada encerrada aparece corretamente.
- Garantir que o botão de salvar fique desabilitado.
