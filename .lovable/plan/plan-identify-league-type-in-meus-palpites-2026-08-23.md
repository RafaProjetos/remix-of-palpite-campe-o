# Plan - Identify League Type in "Meus Palpites"

Display the specific league (Free, Bronze, Prata, or Ouro) the user is participating in on the "Meus Palpites" screen.

## Proposed Changes

### Backend Logic
- Update `getMyBet` server function in `src/lib/palpite.functions.ts` to join with the `leagues` table. This will provide the league name and type (enum) directly in the bet data.

### Frontend UI (Meus Palpites)
- Modify `src/routes/_authenticated/meus-palpites.tsx` to display a badge or card identifying the league type.
- Use the league type to apply consistent styling (e.g., colors for Bronze, Prata, Ouro) similar to the league selection cards on the home/betting pages.
- Place this information prominently, likely near the round title or the points display.

## Technical Details
- **Database:** The `bets` table has a `league_id` foreign key. The `leagues` table contains the `type` (enum: free, bronze, prata, ouro) and `name`.
- **Query Update:** Modify the Supabase query in `getMyBet` to use `.select('*, leagues(*)')`.
- **UI Components:** Use the existing `Badge` component or a custom styled div to match the "Product Card" aesthetic used elsewhere for leagues.

### UI Reference
```tsx
// Example styling logic
const leagueColors = {
  free: "bg-gray-100 text-gray-800 border-gray-200",
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  prata: "bg-slate-100 text-slate-800 border-slate-200",
  ouro: "bg-yellow-100 text-yellow-800 border-yellow-200"
};
```
