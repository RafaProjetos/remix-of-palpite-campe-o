# Plan: Update Round Status Display

We need to update the visual text indicating the status of the round in the home screen and the betting screen. Specifically, when the round is no longer open for betting, it should display "Rodada em andamento" instead of "Aberto para palpites". When the round is fully finished (status 'finished' or 'closed'), it should display "Rodada encerrada".

## Proposed Changes

### 1. Frontend: Home Screen
- **File:** `src/routes/index.tsx`
- **Change:** Update the `Badge` logic in the "Round Games" section to handle "open", "in_progress" (or not open), and "finished/closed" states.
- **Logic:**
    - If `status === 'open'`, show "Aberto para Palpites".
    - If `status === 'closed'` or `status === 'finished'`, show "Rodada Encerrada".
    - Otherwise (e.g., `status === 'in_progress'`), show "Rodada em andamento".

### 2. Frontend: Betting Screen
- **File:** `src/routes/_authenticated/palpitar.tsx`
- **Change:** Update the `Badge` inside the `CardHeader` of the picks card.
- **Logic:**
    - If `pago` is true, show "Confirmado".
    - If `activeLeagueType === 'free'`, show "Gratuito".
    - If `isClosed` is true, differentiate between "Rodada em andamento" and "Rodada encerrada" based on `rodada.data.round.status`.

### 3. Database / API logic (Verification)
- Ensure the `rounds` table status field is correctly utilized by the frontend. The current `getCurrentRound` function fetches the latest round. We will ensure the frontend correctly maps these statuses to the requested Portuguese labels.

## Technical Details

- **Statuses in DB:** The `rounds` table usually has `open`, `closed`, `finished`.
- **Labels:**
    - `open` -> "Aberto para palpites"
    - `closed` (but results not yet fully calculated/verified) -> "Rodada em andamento"
    - `finished` -> "Rodada encerrada"

We will implement a helper or a consistent mapping across these components.
