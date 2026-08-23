# Plan - Visual and Responsiveness Enhancements

Improve the homepage's league selection cards with hover effects and fix section breaking issues on desktop by adjusting team badge sizing and typography.

## User Review Required

> [!IMPORTANT]
> The "Bronze" and "Prata" cards will now have a subtle lift effect and border highlight on hover. The desktop layout for matches will be adjusted to prevent text wrapping on long team names.

## Proposed Changes

### UI & Styling
#### League Cards
- Add `hover:-translate-y-2 hover:shadow-xl` and specific border highlights to the Bronze and Prata cards in `src/routes/index.tsx`.
- Ensure consistency with existing hover effects on the Ouro card.

#### Desktop Responsiveness
- Modify `TeamBadge` in `src/components/team-badge.tsx` to handle responsive font sizes more aggressively for desktop to prevent overflow.
- Update the match grid in `src/routes/index.tsx` to use more flexible column widths or reduced padding on desktop when names are long.
- Specifically, reduce the base font size for team names in `TeamBadge` when `size="md"` is used on desktop.

### Components
#### `src/components/team-badge.tsx`
- Adjust `textSize` constant to include a slightly smaller variant for desktop viewports to prevent "section breaking" (text wrapping/overflow).

#### `src/routes/index.tsx`
- Refine the match card grid (lines 209-257) to ensure adequate space for team badges.
- Apply the requested hover effects to the Bronze and Prata league cards.

## Technical Details
- CSS transitions will be used for smooth hover effects (`transition-all duration-300`).
- Tailwind utility classes like `hover:-translate-y-2`, `hover:border-orange-400`, and `hover:border-slate-400` will be applied.
- Font size adjustments will use standard Tailwind `text-*` classes combined with `sm:` or `lg:` prefixes.
