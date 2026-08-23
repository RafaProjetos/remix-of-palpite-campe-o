import { cn } from "@/lib/utils";

export function TeamBadge({ 
  name, 
  logo, 
  className, 
  position = "away",
  size = "sm",
  layout = "horizontal",
  hideNameOnMobile = false
}: { 
  name: string; 
  logo?: string | null; 
  className?: string;
  position?: "home" | "away";
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  hideNameOnMobile?: boolean;
}) {
  const iconSize = size === "lg" ? "h-10 w-10 sm:h-12 sm:w-12" : size === "md" ? "h-7 w-7 sm:h-9 sm:w-9" : "h-6 w-6 sm:h-8 sm:w-8";
  const textSize = size === "lg" ? "text-[10px] sm:text-lg" : size === "md" ? "text-[9px] sm:text-sm lg:text-[14px]" : "text-[8px] sm:text-xs";

  return (
    <div className={cn(
      "flex min-w-0 items-center gap-2 lg:gap-1.5", 
      layout === "vertical" ? "flex-col text-center" : (position === "home" && "flex-row-reverse text-right"),
      className
    )}>
      {logo ? (
        <img src={logo} alt={`Escudo do ${name}`} className={cn("shrink-0 object-contain", iconSize)} loading="lazy" />
      ) : (
        <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-muted font-bold", iconSize, size === "lg" ? "text-sm" : "text-[10px]")}>
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
      <span className={cn(
        "truncate font-bold tracking-tight text-foreground", 
        textSize,
        hideNameOnMobile && "hidden sm:block"
      )}>{name}</span>
    </div>
  );
}
