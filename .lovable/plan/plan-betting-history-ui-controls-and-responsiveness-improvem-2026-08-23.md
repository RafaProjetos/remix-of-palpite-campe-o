# Plan - Betting History, UI Controls and Responsiveness Improvements

Implement historical round navigation in "Meus Palpites", add betting controls (Cancel/Clear), and enhance the UI for better professional feel and mobile responsiveness.

## User Review Required

> [!IMPORTANT]
> - "Cancel Bet" will delete the current bet and its scores from the database if it hasn't been paid yet.
> - "Clear All" will only reset the scores in the interface without saving to the database until the user clicks "Save".

## Proposed Changes

### 1. Database & Logic Updates
- **src/lib/palpite.functions.ts**:
    - Modify `getCurrentRound` to accept an optional `roundId` parameter.
    - Implement `getRounds` to list all available rounds for the history selector.
    - Implement `deleteBet` to allow users to remove their bets (only if `status != 'paid'`).
    - Modify `getMyBet` to ensure it correctly fetches bets for the selected round and league.

### 2. "Meus Palpites" (My Picks) Enhancements
- **src/routes/_authenticated/meus-palpites.tsx**:
    - Add a Round Selector (dropdown) at the top of the page.
    - Default the selector to the latest active round.
    - Update the UI to refetch data when a different round is selected, allowing users to view their past performance.
    - Ensure the score display and badges correctly reflect the selected historical round status.

### 3. Betting Screen Controls
- **src/routes/_authenticated/palpitar.tsx**:
    - Add "Limpar Tudo" button: Resets all current score inputs to empty in the UI.
    - Add "Cancelar Palpite" button: Calls `deleteBet` to remove the current bet from the database.
    - Only show these buttons when the round is `open` and not yet `paid`.

### 4. UI Professionalization & Responsiveness
- **src/components/team-badge.tsx**:
    - Increase the size of team logos (shields) on mobile devices to improve visibility.
- **src/routes/index.tsx**:
    - Refine typography: Use professional font sizes, reducing them for desktop and adjusting scale for mobile.
    - Adjust margins and paddings for a more balanced layout.
- **General**: Perform a pass over all main screens to ensure perfect responsiveness.

## Technical Details
- Using `shadcn/ui` Select component for the round history.
- `deleteBet` will use `supabase.from('bets').delete()` which cascades to `bet_picks`.
- Typography updates will use Tailwind's responsive font size utilities (e.g., `text-2xl lg:text-3xl`).
