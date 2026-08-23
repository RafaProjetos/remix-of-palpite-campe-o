# Plan - Responsiveness and Hover Refinements

Further refine the desktop layout to prevent team name overflows and enhance the interactivity of league selection cards.

## Proposed Changes

### UI & Styling
#### League Cards (index.tsx)
- Enhance hover effects for **Bronze** and **Prata** cards:
  - Add `hover:scale-[1.02]` to match the Ouro card's animation.
  - Ensure `transition-all duration-300` is applied for smooth scaling and border color changes.

#### Desktop Responsiveness (index.tsx & team-badge.tsx)
- **TeamBadge Component**:
  - Adjust `textSize` for `size="md"` on desktop (`lg`) from `text-base` to `lg:text-sm` or `lg:text-[15px]` to provide more horizontal breathing room.
  - Reduce the gap between shield and name in vertical layout on desktop (`lg:gap-1`).
- **Match Grid**:
  - In `index.tsx`, slightly reduce the horizontal padding of the score badge (`px-4` instead of `px-6`) on desktop to give more space to team names.
  - Adjust `flex` proportions if needed to ensure the score remains centered while teams have maximum width.

### Bug Fixes / Consistency
- Ensure the "Bronze" and "Prata" hover effects are consistent with the "Ouro" card in terms of shadow and lift.

## Technical Details
- Using Tailwind's responsive prefixes (`lg:`, `md:`) to target desktop specifically.
- `truncate` is already used on team names; these changes aim to minimize how often truncation occurs by optimizing space.
