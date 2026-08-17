# Plan: Aprimoramento do Logo e Ajuste de Tamanho

O usuário solicitou que apenas o logo seja exibido, sem o fundo, e em um tamanho maior. A imagem atual possui um fundo complexo (gradiente verde com efeitos), então irei processar a imagem para extrair a parte central do logo e aumentar sua visibilidade no cabeçalho.

## Mudanças sugeridas

### 🎨 Design e UI
- **Remoção do Fundo do Logo**: Utilizar processamento de imagem para tornar transparente o fundo verde escuro ao redor do logo central.
- **Aumento do Tamanho**: Alterar a altura do logo no cabeçalho de `h-10` para `h-16` para torná-lo "um pouco maior".
- **Ajuste do Header**: Garantir que o cabeçalho comporte o logo maior sem quebras de layout.

### 🛠️ Detalhes Técnicos
- **Processamento de Imagem**: Executar comandos `magick` para remover o fundo (usando fuzz e transparência nas cores predominantes das bordas) e recortar o logo central.
- **Atualização de Assets**: Gerar um novo ponteiro de asset para a versão processada do logo.
- **Favicon**: Atualizar o favicon para usar a versão sem fundo.

## Próximos Passos
1. Processar a imagem original para remover o fundo e focar no logo central.
2. Atualizar o arquivo `src/components/site-header.tsx` para aumentar o tamanho do logo.
3. Atualizar o favicon em `public/favicon.png`.
