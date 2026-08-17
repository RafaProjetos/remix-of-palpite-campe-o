---
name: Automatic Logo Fetching
description: Implement automatic team logo fetching when typing team names in manual round creation using API-Football search.
type: feature
---

## Implementation Plan

### Backend Changes

1.  **src/lib/palpite.server.ts**
    - Add `searchTeam(name: string): Promise<{name: string, logo: string} | null>`:
        - Call API-Football `/teams?name={name}&league=71`.
        - Return the first match's name and logo.

2.  **src/lib/admin.functions.ts**
    - Add `adminSearchTeam` server function:
        - Middleware: `requireSupabaseAuth`.
        - Input: `{ name: string }`.
        - Calls `searchTeam(name)` from `palpite.server.ts`.

### Frontend Changes

1.  **src/routes/_authenticated/admin.tsx**
    - Add `useServerFn(adminSearchTeam)`.
    - Implement a mechanism to trigger searches when `homeTeam` or `awayTeam` fields change in the `edit-matches` mode.
    - Use a debounce (500ms) to avoid hitting API limits while typing.
    - Automatically update `homeLogo` or `awayLogo` in the `partidasEdit` state when a result is found.
    - Add a small loading indicator or feedback (optional, but good for UX).

### User Experience
- When the admin types "Flamengo" in the manual creation form, the system searches the API and fills the logo URL field automatically.
- This works for both teams in each of the 10 games.
- Manual override is still possible by editing the logo URL field directly.

## Technical Details
- The search will be scoped to Brasileirão (league 71) to improve accuracy.
- The `API_FOOTBALL_KEY` is required for this feature to work (it was configured by the user in the previous turn).
