# Plan - Fix Mercado Pago Payment Sync Issues

The user is experiencing a delay or failure in payment status updates: a customer paid in the Bronze league, the money was received, but the app still shows "pending". I will improve the webhook's robustness, add manual status synchronization for users, and implement detailed logging to catch future failures.

## User Review Required

> [!IMPORTANT]
> I am adding a **"Sync Status"** button on the "Meus Palpites" screen. If a payment is confirmed by Mercado Pago but hasn't updated in our system, the user can click this to force a refresh.

- Are there any specific error messages you see in the console or network logs during the webhook call? (I will add logging to help identify this).

## Proposed Changes

### Database & Security
- Add more granular logging to the `payments` table (already has `raw` and `updated_at`, but I'll ensure the webhook uses them better).
- Verify RLS policies allow the `service_role` (used by webhooks) to update all necessary fields.

### Backend (Server Functions & Webhooks)
#### `src/routes/api/public/webhooks/mercadopago.ts`
- Improve payload parsing to handle all Mercado Pago event types (`payment.created`, `payment.updated`, `merchant_order`).
- Add a defensive check: if `payment.status` is approved, immediately force the update of the associated `bet`.
- Log the full incoming request for debugging if it fails.

#### `src/lib/palpite.functions.ts`
- Create a new server function `syncPaymentStatus` that:
  1. Fetches the latest status from Mercado Pago using the `payment_id` or `preference_id`.
  2. Updates the `payments` and `bets` tables accordingly.
  3. Returns the new status to the UI.

### Frontend
#### `src/routes/_authenticated/meus-palpites.tsx`
- Add a "Sincronizar Status" button/link next to the "Pagamento Pendente" message.
- This button will call `syncPaymentStatus` and show a loading state/success toast.
- Improve the visual feedback when a payment is detected as approved but not yet reflected in the local cache.

## Technical Details

- **Webhook Route**: The route currently uses `supabaseAdmin` but might be failing if the `bet_id` lookup in `payments` returns no results or if the Mercado Pago API call fails due to token issues.
- **RPC/Functions**: Ensure `round_stats` or other triggers aren't blocking the update due to the 100-player limit logic during the webhook processing (webhooks should ideally bypass the limit if the payment is already done).
- **Graceful Failures**: If the webhook fails, the manual sync will act as a reliable fallback.
