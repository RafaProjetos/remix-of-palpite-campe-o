import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Palpite da Rodada" },
      {
        name: "description",
        content:
          "Conheça como o Palpite da Rodada coleta, utiliza, armazena e protege seus dados pessoais em conformidade com a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — Palpite da Rodada" },
      {
        property: "og:description",
        content: "Informações sobre o tratamento e a proteção dos dados pessoais dos participantes.",
      },
    ],
  }),
  component: Privacidade,
});

const basesLegais = [
  [
    "Cadastro e Contato",
    "Criação de conta, login, autenticação e comunicação sobre rodadas e resultados",
    "Execução de Contrato (art. 7º, V)",
  ],
  [
    "Palpites e Rankings",
    "Apuração de resultados, cálculo de pontos e exibição pública nas tabelas de classificação",
    "Execução de Contrato e Legítimo Interesse (art. 7º, V e IX)",
  ],
  [
    "CPF e Dados de Pagamento",
    "Cobrança de taxas de adesão, prevenção a fraudes/contas múltiplas e pagamento de prêmios",
    "Cumprimento de Obrigação Legal e Execução de Contrato (art. 7º, II e V)",
  ],
  [
    "Registros de IP e Conexão",
    "Registro obrigatório de acessos e segurança da informação",
    "Obrigação Legal — Marco Civil da Internet (art. 7º, II)",
  ],
];

function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:py-12">
        <header className="space-y-4 border-b border-border pb-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Palpite da Rodada</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Política de Privacidade e Proteção de Dados
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Última atualização: Setembro de 2026</p>
        </header>

        <Card>
          <CardContent className="space-y-4 p-6 text-sm leading-7 text-muted-foreground sm:p-8 sm:text-base">
            <p>
              A sua privacidade e a segurança dos seus dados pessoais são prioridades para o Palpite da Rodada
              ("Plataforma", "nós" ou "nosso"). Este documento explica, de maneira clara, transparente e
              acessível, como tratamos, coletamos, armazenamos e protegemos suas informações, em total conformidade
              com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei Federal nº 13.709/2018) e o Marco Civil da
              Internet (Lei Federal nº 12.965/2014).
            </p>
            <p>
              Ao acessar a Plataforma, criar uma conta ou participar de qualquer uma de nossas ligas (gratuitas ou
              pagas), você declara estar ciente e de acordo com as disposições desta Política de Privacidade.
            </p>
          </CardContent>
        </Card>

        <Section number="1" title="Dados pessoais coletados">
          <p>Para permitir o funcionamento do bolão, processar premiações e manter a segurança da aplicação, coletamos as seguintes categorias de dados:</p>
          <DataList
            items={[
              ["Dados de Cadastro e Autenticação", "Nome completo ou nome de exibição/apelido (username); endereço de e-mail; número de telefone celular / WhatsApp; senha criptografada ou identificadores de login social/terceiros."],
              ["Dados Financeiros e de Transação", "CPF (obrigatório para validação antifraude, comprovação de maioridade e liquidação de prêmios via chave PIX); chave PIX ou dados bancários para repasse de premiações; histórico de pagamentos e transações de entrada nas ligas pagas."],
              ["Dados de Atividade e Jogabilidade", "Palpites e prognósticos enviados para cada jogo e rodada; pontuação acumulada, histórico de desempenho e colocação nos rankings das ligas."],
              ["Dados Técnicos de Navegação", "Endereço IP, data e hora de acesso, tipo de navegador, sistema operacional e identificadores de cookies/sessão."],
            ]}
          />
          <p className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <strong className="text-foreground">Nota:</strong> Dados sensíveis de cartão de crédito não são armazenados em nossos servidores, sendo processados diretamente pelo intermediador homologado.
          </p>
        </Section>

        <Section number="2" title="Finalidades e bases legais do tratamento">
          <p>Tratamos seus dados com base nas hipóteses autorizativas do art. 7º da LGPD:</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-foreground">
                <tr>
                  <th className="border-b p-3 font-semibold">Categoria de Dados</th>
                  <th className="border-b p-3 font-semibold">Finalidade Principal</th>
                  <th className="border-b p-3 font-semibold">Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody>
                {basesLegais.map(([categoria, finalidade, base]) => (
                  <tr key={categoria} className="align-top even:bg-muted/30">
                    <td className="border-b p-3 font-medium text-foreground">{categoria}</td>
                    <td className="border-b p-3">{finalidade}</td>
                    <td className="border-b p-3">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section number="3" title="Exibição pública de dados no ranking">
          <p>Ao participar das ligas do Palpite da Rodada, você reconhece e concorda que:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>O seu nome de exibição (apelido/username) e a sua pontuação ficarão visíveis para os demais participantes nas tabelas públicas de ranking;</li>
            <li>Informações confidenciais, como e-mail, telefone, CPF e chaves de pagamento, jamais serão divulgadas ao público ou a outros usuários.</li>
          </ul>
        </Section>

        <Section number="4" title="Compartilhamento de dados com terceiros">
          <p>Não comercializamos nem transferimos seus dados pessoais para terceiros para fins de publicidade não autorizada. O compartilhamento ocorre estritamente quando necessário para a operação do serviço:</p>
          <DataList
            items={[
              ["Processadores de Pagamento", "Compartilhamos dados essenciais com intermediadores financeiros (ex.: Mercado Pago) para viabilizar pagamentos de inscrições e transferências de premiações."],
              ["Provedores de Infraestrutura e Nuvem", "Servidores de banco de dados, hospedagem e ferramentas de monitoramento de performance da aplicação."],
              ["Autoridades Governamentais e Judiciais", "Mediante ordem judicial expressa ou para cumprimento de obrigações legais, regulatórias e fiscais."],
            ]}
          />
        </Section>

        <Section number="5" title="Segurança e retenção das informações">
          <p><strong className="text-foreground">Medidas de Proteção:</strong> Adotamos protocolos padrão de segurança, incluindo criptografia SSL/TLS em trânsito, controle restrito de acesso administrativo e proteção de credenciais.</p>
          <p><strong className="text-foreground">Período de Retenção:</strong> Seus dados cadastrais e histórico de palpites permanecerão armazenados enquanto sua conta estiver ativa. Caso solicite a exclusão, os dados serão descartados, ressalvados aqueles necessários para cumprimento de obrigações legais, fiscais ou regulatórias (como os logs de conexão pelo prazo mínimo estipulado no Marco Civil da Internet).</p>
        </Section>

        <Section number="6" title="Comunidades externas (ex.: WhatsApp)">
          <p>A Plataforma disponibiliza links para comunidades e grupos opcionais em plataformas de terceiros (como grupos de WhatsApp). O ingresso e a interação nesses grupos são voluntários, e a privacidade, termos de uso e visibilidade de número telefônico no respectivo aplicativo são regidos exclusivamente pelas políticas da controladora do serviço (Meta Platforms).</p>
        </Section>

        <Section number="7" title="Direitos do titular dos dados">
          <p>Nos termos do artigo 18 da LGPD, você possui os seguintes direitos em relação aos seus dados:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso facilitado aos seus dados armazenados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
            <li>Eliminação dos dados pessoais tratados com o seu consentimento;</li>
            <li>Informação sobre entidades públicas e privadas com as quais realizamos uso compartilhado;</li>
            <li>Revogação do consentimento a qualquer momento.</li>
          </ul>
          <p>Para exercer qualquer um destes direitos, basta enviar uma solicitação através do nosso canal de suporte ou pelo e-mail do Encarregado de Proteção de Dados (DPO).</p>
        </Section>

        <Section number="8" title="Restrito a maiores de idade">
          <p>Os serviços e ligas com premiação em dinheiro do Palpite da Rodada são estritamente destinados a pessoas com 18 (dezoito) anos completos ou mais. Não coletamos intencionalmente dados de menores de idade. Caso seja identificada conta pertencente a menor, o cadastro será encerrado e os dados excluídos sumariamente.</p>
        </Section>

        <Section number="9" title="Alterações desta política">
          <p>Reservamo-nos o direito de atualizar este Regulamento de Privacidade periodicamente para refletir melhorias no sistema ou adequações legais. Notificações sobre alterações materiais serão publicadas na Plataforma ou encaminhadas ao e-mail cadastrado.</p>
        </Section>

        <Section number="10" title="Contato e Encarregado (DPO)">
          <p>Em caso de dúvidas sobre esta Política, solicitações relativas aos seus dados ou necessidade de contato com o Encarregado pelo Tratamento de Dados Pessoais (DPO), contate:</p>
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1 text-sm">
              <p><strong className="text-foreground">E-mail:</strong> <a className="text-primary hover:underline" href="mailto:contato@palpitenarodada.com.br">contato@palpitenarodada.com.br</a> (ou e-mail oficial de suporte vinculado ao domínio)</p>
              <p><strong className="text-foreground">Canal de Atendimento:</strong> Aba "Suporte / Regulamento" na própria Plataforma.</p>
            </div>
          </div>
        </Section>

        <p className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Esta política deve ser lida em conjunto com o Regulamento Oficial da Plataforma.
        </p>
      </main>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-xl sm:text-2xl">
          <span className="mr-2 text-primary">{number}.</span>{title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6 text-sm leading-7 text-muted-foreground sm:p-8 sm:text-base">
        {children}
      </CardContent>
    </Card>
  );
}

function DataList({ items }: { items: [string, string][] }) {
  return (
    <ul className="space-y-3">
      {items.map(([title, description]) => (
        <li key={title}>
          <strong className="text-foreground">{title}:</strong> {description}
        </li>
      ))}
    </ul>
  );
}
