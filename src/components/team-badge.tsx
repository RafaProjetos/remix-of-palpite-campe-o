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
  const iconSize = size === "lg" ? "h-10 w-10 sm:h-12 sm:w-12" : size === "md" ? "h-8 w-8 sm:h-10 sm:w-10" : "h-6 w-6 sm:h-8 sm:w-8";
  const textSize = size === "lg" ? "text-sm sm:text-lg" : size === "md" ? "text-xs sm:text-base" : "text-xs sm:text-sm";

  return (
    <div className={cn(
      "flex min-w-0 items-center gap-2", 
      position === "home" && "flex-row-reverse text-right",
      className
    )}>
      {logo ? (
        <img src={logo} alt={`Escudo do ${name}`} className={cn("shrink-0 object-contain", iconSize)} loading="lazy" />
      ) : (
        <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-muted font-bold", iconSize, size === "lg" ? "text-sm" : "text-[10px]")}>
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
      <span className={cn("truncate font-bold tracking-tight text-foreground", textSize)}>{name}</span>
    </div>
  );
}
