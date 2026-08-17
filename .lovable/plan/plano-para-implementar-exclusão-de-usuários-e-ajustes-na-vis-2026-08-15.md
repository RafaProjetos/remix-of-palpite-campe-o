# Plano para Implementar Exclusão de Usuários e Ajustes na Visão Administrativa

Este plano detalha a adição da funcionalidade de exclusão de usuários pelo administrador, garantindo que a remoção seja propagada para todos os rankings e visões, e oculta a opção "Admin" no menu para usuários não administrativos.

## Alterações Propostas

### Backend (Banco de Dados e Funções de Servidor)

1.  **Nova Função Administrativa**: Criar a função `adminDeleteUser` em `src/lib/admin.functions.ts`.
    *   Esta função usará o `supabaseAdmin` para excluir o usuário da tabela `auth.users`.
    *   A exclusão em cascata (ON DELETE CASCADE) configurada nas chaves estrangeiras (`profiles.id`, `user_roles.user_id`, `bets.user_id`, `payments.user_id`) garantirá que todos os dados relacionados sejam removidos automaticamente.
    *   A remoção das apostas (`bets`) e seus respectivos palpites (`bet_picks`) fará com que o usuário suma dos rankings (já que as funções de ranking como `general_ranking` e `round_ranking` dependem dessas tabelas).

### Frontend (Interface Administrativa)

2.  **Interface de Exclusão no Painel Admin**: Modificar `src/routes/_authenticated/admin.tsx`.
    *   Adicionar um botão de exclusão (ícone de lixeira ou botão "Excluir") ao lado de cada participante na lista.
    *   Implementar um diálogo de confirmação (utilizando `window.confirm` ou um componente de Dialog) para evitar exclusões acidentais.
    *   Adicionar a lógica para chamar a nova função `adminDeleteUser` e atualizar a interface após o sucesso.

### Frontend (Menu de Navegação)

3.  **Ocultar Link Admin para Usuários**: Modificar `src/components/site-header.tsx`.
    *   Utilizar a informação de `isAdmin` (já disponível ou obtida via `getMyStatus`) para renderizar condicionalmente o link "Admin" no menu (tanto desktop quanto mobile).
    *   Atualmente, o link é exibido para todos, o que confunde os usuários.

## Detalhes Técnicos

### Backend (`src/lib/admin.functions.ts`)
```typescript
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
```

### Segurança
*   A exclusão de usuários é uma ação crítica e só será permitida através da `service_role` (via `supabaseAdmin`) após verificação explícita de que o solicitante é um administrador (`assertAdmin`).
*   O link "Admin" no menu será removido visualmente, e a rota `/admin` já possui proteção no servidor que impede o acesso de não administradores.

## Verificação
1.  **Funcional**: Tentar acessar o painel Admin com uma conta comum e verificar se o link sumiu e o acesso é negado.
2.  **Administrativa**: Como administrador, excluir um usuário de teste e verificar se ele desaparece da lista de participantes e se suas pontuações somem dos rankings.
