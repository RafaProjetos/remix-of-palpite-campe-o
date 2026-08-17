import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount, acceptTerms } from "@/lib/palpite.functions";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ADMIN_EMAIL = "adm@palpitedarodada.app";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar ou cadastrar — Palpite da Rodada" },
      {
        name: "description",
        content: "Crie sua conta no Palpite da Rodada e participe do bolão da rodada do Brasileirão.",
      },
      { property: "og:title", content: "Entrar — Palpite da Rodada" },
      { property: "og:description", content: "Acesse sua conta para palpitar na rodada." },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const criarAdmin = useServerFn(ensureAdminAccount);
  const [carregando, setCarregando] = useState(false);
  const aceitarTermos = useServerFn(acceptTerms);

  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [ciente, setCiente] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  async function recuperarSenha() {
    if (!emailRecuperacao) {
      toast.error("Informe seu e-mail para recuperação.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperacao, {
      redirectTo: `${window.location.origin}/entrar`,
    });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("E-mail de recuperação enviado!");
    setDialogoAberto(false);
  }

  async function entrar() {
    if (identifier.trim().toUpperCase() === "ADM") {
      return entrarAdmin();
    }

    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: identifier, password: senha });
    setCarregando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/palpitar" });
  }

  async function entrarAdmin() {
    if (senha !== "#010101") {
      toast.error("Senha do administrador incorreta.");
      return;
    }

    setCarregando(true);
    try {
      // Sincroniza/Garante a conta admin no banco com a senha correta
      await criarAdmin({});
      
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: senha,
      });
      
      if (error) throw new Error("Falha na autenticação do administrador.");
      navigate({ to: "/admin" });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível entrar como administrador.");
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrar() {
    if (!ciente) {
      toast.error("Você precisa aceitar os termos para se cadastrar.");
      return;
    }
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { 
        data: { 
          full_name: nome,
          phone: telefone
        }, 
      },
    });
    
    if (error) {
      setCarregando(false);
      toast.error(error.message);
      return;
    }

    // Se a sessão já estiver presente (auto-login), salvar o perfil
    if (data.session) {
      try {
        await aceitarTermos({ data: { fullName: nome, phone: telefone } });
      } catch (e) {
        console.error("Erro ao atualizar perfil:", e);
      }
    }

    // Tentar logar imediatamente caso o signUp não auto-logue (depende da config do projeto)
    if (!data.session) {
      console.log("Sem sessão após signUp, tentando login manual...");
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password: senha 
      });
      
      if (loginError) {
        setCarregando(false);
        console.error("Erro no login automático:", loginError);
        // Se falhar o login, mas a conta foi criada, avisamos e deixamos o usuário tentar entrar manualmente
        toast.info("Conta criada com sucesso! Por favor, entre com seu e-mail e senha abaixo.");
        // Mudar para a aba de entrar
        const tabsElement = document.querySelector('[role="tablist"]');
        const entrarTab = tabsElement?.querySelector('[value="entrar"]') as HTMLElement;
        entrarTab?.click();
        return;
      }
      
      if (!loginData.session) {
        setCarregando(false);
        toast.info("Conta criada com sucesso! Por favor, entre com seu e-mail e senha abaixo.");
        return;
      }

      // Após login manual, salvar perfil
      try {
        await aceitarTermos({ data: { fullName: nome, phone: telefone } });
      } catch (e) {
        console.error("Erro ao atualizar perfil:", e);
      }
    }
    
    setCarregando(false);
    toast.success("Cadastro realizado!");
    navigate({ to: "/regulamento" });
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Acessar o Palpite da Rodada</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="cadastrar">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar" className="space-y-4 pt-4">
                 <Campo label="E-mail ou Usuário" value={identifier} onChange={setIdentifier} />
                 <Campo
                   label="Senha"
                   value={senha}
                   onChange={setSenha}
                   type="password"
                   onToggleShow={() => setMostrarSenha(!mostrarSenha)}
                   showValue={mostrarSenha}
                 />
                <Button className="w-full" onClick={entrar} disabled={carregando}>
                  Entrar
                </Button>
                <div className="text-center">
                  <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
                    <DialogTrigger asChild>
                      <button className="text-sm text-primary hover:underline" type="button">
                        Esqueceu a senha?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar Senha</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1">
                          <Label>E-mail da conta</Label>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={emailRecuperacao}
                            onChange={(e) => setEmailRecuperacao(e.target.value)}
                          />
                        </div>
                        <Button className="w-full" onClick={recuperarSenha} disabled={carregando}>
                          Enviar e-mail de recuperação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>

              <TabsContent value="cadastrar" className="space-y-4 pt-4">
                <Campo label="Nome completo" value={nome} onChange={setNome} />
                <Campo label="E-mail" value={email} onChange={setEmail} type="email" />
                <Campo label="Número com Whatsapp" value={telefone} onChange={setTelefone} type="tel" />
                <Campo
                  label="Senha"
                  value={senha}
                  onChange={setSenha}
                  type="password"
                  onToggleShow={() => setMostrarSenha(!mostrarSenha)}
                  showValue={mostrarSenha}
                />
                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="mb-2 font-semibold">Termos e Uso de Dados:</p>
                  <p>
                    Ao se cadastrar, você concorda que seus dados (nome, e-mail e palpites) serão utilizados
                    <strong> estritamente para a participação nos palpites</strong>, processamento de pagamentos e
                    exibição nos rankings do sistema. Não compartilhamos seus dados com terceiros.
                  </p>
                </div>
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={ciente}
                    onChange={(e) => setCiente(e.target.checked)}
                  />
                  <span>
                    Li e aceito os termos de uso e autorizo o uso dos meus dados conforme descrito acima.
                  </span>
                </label>
                <Button 
                  className="w-full" 
                  onClick={cadastrar} 
                  disabled={carregando || !ciente}
                >
                  Criar conta
                </Button>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  onToggleShow,
  showValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  onToggleShow?: () => void;
  showValue?: boolean;
}) {
  const inputType = type === "password" && showValue ? "text" : type;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="relative">
        <Input type={inputType} value={value} onChange={(e) => onChange(e.target.value)} />
        {type === "password" && onToggleShow && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onToggleShow}
          >
            {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
