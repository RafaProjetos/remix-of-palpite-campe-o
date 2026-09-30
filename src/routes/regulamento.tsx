import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { acceptTerms, getMyStatus } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { traduzirErro } from "@/lib/mensagens";

export const Route = createFileRoute("/regulamento")({
  head: () => ({
    meta: [
      { title: "Regulamento Oficial — Palpite da Rodada" },
      {
        name: "description",
        content:
          "Consulte as regras oficiais, critérios de pontuação e termos de participação das Ligas Free, Bronze, Prata e Ouro.",
      },
      { property: "og:title", content: "Regulamento Oficial — Palpite da Rodada" },
      { property: "og:description", content: "Informações detalhadas sobre o funcionamento e participação no bolão." },
    ],
  }),
  component: Regulamento,
});

const REGRAS = [
  ["Placar exato do jogo", "30 pontos"],
  ["Acertar apenas o time vencedor", "10 pontos"],
  ["Palpitar empate e sair empate com outro placar", "15 pontos"],
  ["Acertar o placar de apenas um dos times", "5 pontos"],
  ["Acertar a diferença de gols", "2 pontos"],
];

function Regulamento() {
  const navigate = useNavigate();
  const aceitar = useServerFn(acceptTerms);
  const carregarStatus = useServerFn(getMyStatus);
  const [logado, setLogado] = useState(false);
  const statusQuery = useQuery({ queryKey: ["meu-status"], queryFn: () => carregarStatus({}), enabled: logado });
  const [jaAceito, setJaAceito] = useState(false);
  const [ciente, setCiente] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLogado(Boolean(data.session));
    });
  }, []);

  useEffect(() => {
    if (statusQuery.data) {
      setJaAceito(Boolean(statusQuery.data.profile?.terms_accepted_at));
    }
  }, [statusQuery.data]);

  async function confirmar() {
    if (!ciente) {
      toast.error("Marque a autorização para continuar.");
      return;
    }
    setEnviando(true);
    try {
      await aceitar({ data: {} });
      toast.success("Regulamento aceito! Bons palpites.");
      await statusQuery.refetch();
      navigate({ to: "/palpitar" });
    } catch (e: any) {
      toast.error(traduzirErro(e?.message) ?? "Não foi possível salvar o aceite.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Regulamento</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Funcionamento do Jogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground sm:text-base">
            <p>
              O <strong>Palpite da Rodada</strong> é um concurso de prognósticos baseado nas partidas da Série A do Brasileirão 2026.
              Em cada rodada, são selecionados 10 confrontos para a realização dos palpites.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Liga Free:</strong> Participação gratuita destinada à diversão e acompanhamento do ranking geral entre amigos.</li>
              <li><strong>Ligas Pagas (Bronze, Prata e Ouro):</strong> Competições com taxas de adesão de R$ 5, R$ 20 ou R$ 50. O montante arrecadado é distribuído entre os <strong>10 primeiros colocados</strong> da rodada.</li>
              <li><strong>Critérios de Desempate:</strong> Caso ocorra igualdade na pontuação, serão considerados, sucessivamente, o número de placares exatos, o acerto do vencedor da partida e a ordem cronológica do registro do palpite.</li>
              <li><strong>Distribuição de Prêmios:</strong> Deduzida a taxa administrativa de 10%, a totalidade do pote líquido é destinada à premiação dos participantes.</li>
              <li><strong>Privacidade e Segurança:</strong> Suas informações são utilizadas estritamente para identificação de apostas e processamento de premiações via Pix.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Regulamento Oficial V2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-6">
            <p className="text-sm text-muted-foreground sm:text-base">
              Faça o download do documento completo do regulamento oficial para consultar as regras detalhadas.
            </p>
            <a
              href="/docs/regulamento.pdf"
              download
              className="inline-flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary/10 hover:underline"
            >
              Baixar o Regulamento Oficial V2 (PDF)
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pontuação por jogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:p-6">
            {REGRAS.map(([regra, pontos]) => (
              <div key={regra} className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
                <span className="text-sm sm:text-base">{regra}</span>
                <span className="text-sm font-bold text-primary sm:text-base">{pontos}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground sm:text-sm">
              O placar exato vale 30 pontos e substitui os demais critérios. Os outros critérios podem ser somados entre si no mesmo jogo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Segurança e Privacidade de Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground sm:text-base">
              A proteção de seus dados é nossa prioridade. Informações como nome, e-mail e telefone são utilizadas exclusivamente para a identificação do participante nos rankings e para a viabilização do pagamento de prêmios. O tratamento de dados é realizado em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>

            {!logado && (
              <p className="rounded-lg bg-muted p-3 text-sm font-medium sm:text-base">
                Por favor, realize o login ou crie uma conta para registrar o aceite do regulamento.
              </p>
            )}

            {logado && jaAceito && (
              <p className="rounded-lg bg-primary/10 p-3 text-center text-sm font-semibold text-primary sm:text-base">
                Você já aceitou o regulamento e está habilitado a realizar seus palpites. Boa sorte!
              </p>
            )}

            {logado && !jaAceito && (
              <div className="space-y-6">
                <label className="flex cursor-pointer items-start gap-3 text-sm sm:text-base">
                  <Checkbox checked={ciente} onCheckedChange={(v) => setCiente(Boolean(v))} className="mt-1" />
                  <span className="font-medium">
                    Li e concordo com os termos do regulamento e autorizo o tratamento dos meus dados para as finalidades descritas.
                  </span>
                </label>
                <Button onClick={confirmar} disabled={enviando} className="w-full py-6 font-semibold sm:w-auto">
                  {enviando ? "Processando..." : "Confirmar Aceite do Regulamento"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
