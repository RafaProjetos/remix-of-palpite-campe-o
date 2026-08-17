import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRound } from "@/lib/palpite.functions";
import { Clock } from "lucide-react";

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function formatarRestante(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const min = Math.floor((total % 3600) / 60);
  const seg = total % 60;
  if (dias > 0) return `${dias}d ${horas}h ${min}min`;
  if (horas > 0) return `${horas}h ${min}min`;
  return `${min}min ${seg}s`;
}

export function RoundDeadlineBar() {
  const isHydrated = useHydrated();
  const rodada = useQuery({ queryKey: ["rodada-atual"], queryFn: () => getCurrentRound({}) });
  const [agora, setAgora] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const round = rodada.data?.round as any;
  if (!isHydrated || !round) return null;

  if (!round.closes_at) {
    if (round.status !== "open") return null;
    return (
      <div className="border-b border-destructive/30 bg-destructive/10 text-center text-xs sm:text-sm">
        <div className="mx-auto max-w-6xl px-4 py-2 font-medium">
          Prazo de encerramento ainda não definido para {round.title}.
        </div>
      </div>
    );
  }


  const fecha = new Date(round.closes_at);
  const encerrado = round.status !== "open" || fecha.getTime() <= agora;

  const dataTexto = fecha.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`border-b text-center text-xs sm:text-sm ${
        encerrado
          ? "border-border bg-muted text-muted-foreground"
          : "border-primary/20 bg-primary/10 text-foreground"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1 px-4 py-2 sm:flex-row sm:gap-2">
        <span className="flex items-center gap-1.5 font-semibold">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {round.title || `Rodada ${round.number}`}
        </span>
        {encerrado ? (
          <span>Palpites encerrados em {dataTexto}</span>
        ) : (
          <span>
            Palpites abertos até <strong>{dataTexto}</strong> · faltam{" "}
            <strong>{formatarRestante(fecha.getTime() - agora)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
