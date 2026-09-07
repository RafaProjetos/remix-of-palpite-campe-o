const MENSAGENS_PT: Array<[RegExp, string]> = [
  [/email not confirmed/i, "E-mail não confirmado. Verifique sua caixa de entrada e confirme o cadastro."],
  [/invalid login credentials|invalid.*credentials/i, "E-mail ou senha incorretos."],
  [/user already registered|already been registered/i, "Este e-mail já está cadastrado. Faça login ou recupere a senha."],
  [/password should be at least (\d+)/i, "A senha deve ter pelo menos $1 caracteres."],
  [/unable to validate email address|invalid format|invalid email/i, "Informe um e-mail válido."],
  [/email rate limit exceeded|over_email_send_rate_limit/i, "Muitas tentativas. Aguarde alguns minutos e tente novamente."],
  [/for security purposes.*(\d+) seconds/i, "Por segurança, aguarde $1 segundos antes de tentar novamente."],
  [/signups not allowed|signup is disabled/i, "Os cadastros estão temporariamente desativados."],
  [/user not found/i, "Não encontramos uma conta com esse e-mail."],
  [/token has expired|invalid token|otp expired/i, "O link expirou. Solicite um novo e-mail de confirmação."],
  [/session missing|not authenticated|unauthorized/i, "Sua sessão expirou. Entre novamente para continuar."],
  [/row-level security|row level security/i, "Você não tem permissão para esta ação. Entre novamente e tente de novo."],
  [/duplicate key/i, "Este registro já existe."],
  [/network|failed to fetch|fetcherror/i, "Falha de conexão. Verifique sua internet e tente novamente."],
];

/** Traduz mensagens de erro conhecidas para o Português do Brasil. */
export function traduzirErro(mensagem?: string | null) {
  if (!mensagem) return "Ocorreu um erro. Tente novamente.";
  for (const [padrao, texto] of MENSAGENS_PT) {
    if (padrao.test(mensagem)) return mensagem.replace(padrao, texto);
  }
  // Se a mensagem estiver em inglês (sem acentuação/padrões PT), usa genérica amigável
  if (!/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(mensagem) && /^[\x20-\x7E]*$/.test(mensagem)) {
    return "Não foi possível concluir a ação. Tente novamente.";
  }
  return mensagem;
}
