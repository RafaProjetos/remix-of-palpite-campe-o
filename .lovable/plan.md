# Plan - Fix "Aberto para palpites" display on Home Page

The user reported that the "Aberto para palpites" badge is still appearing on the home page even when the round is closed/in progress. I will update the logic in the home page to correctly reflect the round status, ensuring that when the round is not "open", it shows "Rodada em andamento" or "Rodada Encerrada" as previously intended.

## User Review Required
> [!IMPORTANT]
> The fix will ensure the "Aberto para palpites" text only shows when the round status is explicitly "open". If it's closed, it will show "Rodada Encerrada" or "Rodada em andamento".

## Proposed Changes

### Frontend Edits

#### [src/routes/index.tsx](src/routes/index.tsx)
- Refine the status badge logic in the "Próximos Jogos" card.
- Ensure `round.status === "open"` is the strict condition for showing "Aberto para Palpites".
- If the round status is `finished` or `closed`, show "Rodada Encerrada".
- For all other non-open states (like `in_progress`), show "Rodada em andamento".

## Verification Plan

### Manual Verification
1. Open the preview URL.
2. Check the "Próximos Jogos" section on the Home Page.
3. Verify that the badge status matches the current round status fetched from the backend.
4. If a round is closed in the database, confirm it no longer says "Aberto para Palpites".

### Automated Verification
- Run a check via Playwright to inspect the text content of the badge element when the mock/real status is changed (if applicable in local test environment).
