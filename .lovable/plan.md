# Remover bloqueio do regulamento e corrigir nomes no ranking

## Alterações
- Remover da tela e do salvamento de palpites qualquer exigência de aceite do regulamento; o aceite continuará obrigatório somente no cadastro da conta.
- Manter a página de regulamento disponível apenas para consulta, sem controlar o acesso aos palpites.
- Padronizar a identificação exibida em todos os rankings e detalhes públicos: nome cadastrado; na ausência, parte do e-mail antes de `@`; nunca “Apostador”.
- Corrigir os perfis atuais sem nome ou e-mail usando os dados já existentes nas contas.
- Reforçar a criação de perfis para que novos cadastros sempre gravem nome e e-mail e não repitam o problema.

## Verificação
- Confirmar que um usuário autenticado consegue abrir e salvar palpites sem aceite prévio separado.
- Conferir os rankings da página inicial e da classificação, inclusive participantes antigos.
- Validar a aplicação em celular e verificar o resultado da compilação.

## Detalhes técnicos
- Ajustar a função de gravação de palpites e a renderização da tela de palpites.
- Atualizar as funções de ranking no banco para consultar também os dados da conta quando o perfil estiver incompleto.
- Atualizar os registros incompletos existentes sem alterar apostas, pontuações ou cadastros.
