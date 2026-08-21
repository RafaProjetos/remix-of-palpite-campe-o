import { cn } from "@/lib/utils";

export function TeamBadge({ 
  name, 
  logo, 
  className, 
  position = "away" 
}: { 
  name: string; 
  logo?: string | null; 
  className?: string;
  position?: "home" | "away";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={cn(
      "flex min-w-0 items-center gap-1.5 sm:gap-2", 
      position === "home" && "flex-row-reverse",
      className
    )}>
      {logo ? (
        <img src={logo} alt={`Escudo do ${name}`} className="h-6 w-6 shrink-0 object-contain sm:h-8 sm:w-8" loading="lazy" />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold sm:h-8 sm:w-8 sm:text-xs">
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
      <span className="hidden truncate text-xs font-medium sm:inline sm:text-sm">{name}</span>
    </div>
  );
}
