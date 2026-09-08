import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

type Props = {
  roundId?: string | null;
  roundNumber?: number | null;
  leagueType: string;
  leagueName?: string | null;
  validado: boolean;
  vencedor?: string | null;
  pontos?: number | null;
};

const CORES: Record<string, string> = {
  free: "from-sky-500/20 to-blue-500/10 text-sky-600",
  bronze: "from-amber-600/20 to-orange-500/10 text-amber-700",
  prata: "from-slate-400/25 to-slate-200/10 text-slate-600",
  ouro: "from-yellow-400/25 to-amber-300/10 text-yellow-600",
};

const CONFETES = Array.from({ length: 40 }, (_, i) => i);

/** Comemora o campeão da liga uma única vez por acesso, enquanto a rodada validada for a atual. */
export function CelebracaoCampeao({
  roundId,
  roundNumber,
  leagueType,
  leagueName,
  validado,
  vencedor,
  pontos,
}: Props) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!validado || !roundId || !vencedor) return;
    const chave = `campeao:${roundId}:${leagueType}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(chave)) return;
    window.sessionStorage.setItem(chave, "1");
    setAberto(true);
  }, [validado, roundId, leagueType, vencedor]);

  if (!vencedor) return null;
  const cor = CORES[leagueType] ?? CORES.free;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogContent className="max-w-sm overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETES.map((i) => (
            <span
              key={i}
              className="absolute top-[-10%] block h-2 w-1.5 rounded-[1px] opacity-80"
              style={{
                left: `${(i * 37) % 100}%`,
                backgroundColor: ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#eab308"][i % 5],
                animation: `confete-cair ${2.4 + ((i % 5) * 0.4)}s linear ${((i % 7) * 0.18).toFixed(2)}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative space-y-4 py-4">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${cor}`}>
            <Trophy className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {leagueName || "Liga"} {roundNumber ? `· Rodada ${roundNumber}` : ""}
            </p>
            <h2 className="text-2xl font-extrabold leading-tight">Temos um campeão!</h2>
            <p className="text-lg font-semibold text-primary break-words">{vencedor}</p>
            {typeof pontos === "number" && (
              <p className="text-sm text-muted-foreground">{pontos} pontos · 1º lugar</p>
            )}
          </div>
          <Button className="w-full" onClick={() => setAberto(false)}>
            Ver classificação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
