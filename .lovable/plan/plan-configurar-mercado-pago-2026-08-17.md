# Plan: Configurar Mercado Pago

O usuário solicitou a configuração da seção de pagamentos do Mercado Pago, fornecendo um Access Token. O objetivo é integrar este token ao backend para processar pagamentos de palpites premiados.

## Ações realizadas

- Identificado que o código já possui lógica para integração com Mercado Pago em `src/lib/palpite.server.ts` e webhooks em `src/routes/api/public/webhooks/mercadopago.ts`.
- Verificado que o token é lido da variável de ambiente `MERCADOPAGO_ACCESS_TOKEN`.
- Confirmado que a variável `MERCADOPAGO_ACCESS_TOKEN` ainda não está configurada no projeto.

## Próximos passos

1. **Adicionar o Secret**: Utilizar a ferramenta `secrets--set_secret` para salvar o token fornecido pelo usuário (`APP_USR-2180104598246133-063015-8e4428e5bc042c69e8df6d274d0863b2-192271006`) sob o nome `MERCADOPAGO_ACCESS_TOKEN`.
2. **Validar a integração**: O código existente em `src/lib/palpite.server.ts` utiliza a API do Mercado Pago para criar preferências de checkout. Após adicionar o secret, a funcionalidade "Ganhe com seu Palpite" (CTA de pagamento) deve começar a gerar links de pagamento válidos.

## Detalhes técnicos

- A variável `MERCADOPAGO_ACCESS_TOKEN` será injetada como variável de ambiente no runtime do backend (TanStack Start / Cloudflare Workers).
- O fluxo de pagamento já está mapeado para o webhook `/api/public/webhooks/mercadopago`, que atualiza o status da aposta para `paid` quando o pagamento é aprovado.
- Não são necessárias alterações de código, apenas a configuração da credencial.
