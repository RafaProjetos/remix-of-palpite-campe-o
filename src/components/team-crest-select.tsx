import { SERIE_A_TEAMS } from '@/lib/constants';
import { TEAM_CRESTS } from '@/lib/team-crests';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TeamCrestSelect({ value, onChange, label }: {
  value?: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const selected = SERIE_A_TEAMS.find((team) => TEAM_CRESTS[team] === value);
  return (
    <div className="flex min-w-0 items-center gap-2">
      {value && <img src={value} alt={selected ? `Escudo do ${selected}` : label} className="h-6 w-6 shrink-0 object-contain sm:h-8 sm:w-8" />}
      <Select value={selected ?? (value ? 'current' : 'none')} onValueChange={(team) => {
        if (team === 'current') return;
        onChange(TEAM_CRESTS[team] ?? '');
      }}>
        <SelectTrigger aria-label={label} className="min-w-0 flex-1 [&>span]:truncate">
          <SelectValue placeholder="Selecione o escudo" />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-2rem)]">
          <SelectItem value="none">Sem escudo</SelectItem>
          {value && !selected && <SelectItem value="current">Escudo atual</SelectItem>}
          {SERIE_A_TEAMS.map((team) => (
            <SelectItem key={team} value={team} textValue={team}>
              <span className="flex items-center gap-2">
                <img src={TEAM_CRESTS[team]} alt="" className="h-6 w-6 shrink-0 object-contain sm:h-8 sm:w-8" loading="lazy" />
                <span className="text-xs">{team}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}