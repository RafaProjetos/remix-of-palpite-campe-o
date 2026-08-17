# Remix of Palpite Campeão

Crie um sistema/app para apostas na rodada do campeonato brasileiro via API pública disponivel on line com a rodada e os escudos dos times. O usuário se cadastra na  plataforma e palpita nos 10 jogos da rodada disponível, inserindo o placar de cada jogo, ao final do palpite para a rodada em vigente ele paga via app de pagamentos do mercado pago o valor de R$ 50 reais por toda a aposta. Chave token para intergrar o pagamento: APP_USR-2180104598246133-063015-8e4428e5bc042c69e8df6d274d0863b2-192271006. Crie tmb um acesso para o adm que deverá entrar com o usuário ADM e a senha deverá ser #010101. No acesso vai ser possivel ver todos os participantes que pagaram em linhas clicaveis. Ao clicar em cada um deles será possível ver os seus respectivos palpites. Tem também um painel onde posso ver o valor total arrecadado para a rodada e um local "validador", onde eu clico num botão para receber, Via API os placares reais de cada jogo e assim obter a classificação para cada apostador ou um botão para inserir manualmente os resultados dos jogos reais da rodada. Antes de clicar em qualquer um deles os jogos ficam sem ter como acessar, opacos. A sistemática para cada aposta vai ser da seguinte forma: o sistema deve aceitar apenas 100 apostadores pagantes. Para cada jogo que o apostador acertar ele ganha 30 pontos; se o apostador acertar o time vencedor apenas, sem acertar o placar, ganha 10 pontos; se o apostador preencher empate e sair um outro empate diferente do placar ganha 15 pontos; se o apostador acertar o placar de um dos times apenas, ganha 5 pontos; se o apostador acertar a diferença de gols em relação à sua aposta ganha 5 pontos. Essa pontuação se aplica para todos os jogos palpitados pelo apostador e quem somar mais pontos ao final daquela rodada vence. O Ranking deve ficar disponivel no painel da visão do usuário para ele ir conferindo em tempo real. Assim que o usuário se cadastra e joga uma rodada, independentemente de qual seja, participa de um ranking geral onde pode ganhar um prêmio extra no final da competição, para incentivar a participação em todas as rodadas. Participou da rodada ja vai compor o ranking e aumentando a pontuação sempre que jogar novamente. O Sistema/app deve se chamar Palpite da Rodada. Deve ser nas cores Verde, Amarelo e Azul. O Sistema deve ter um menu com o regulamento onde o usuário deve autorizar e estar ciente de como funciona e autorizar o uso dos seus dados restritamente dentro do app para poder participar. Essa autorização se dá após o cadastro.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ff4fef7-25d2-43ad-9196-13680cff3c6e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
