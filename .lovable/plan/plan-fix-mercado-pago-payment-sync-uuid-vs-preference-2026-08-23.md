# Plan - Fix Mercado Pago Payment Sync (UUID vs Preference)

The user provided a specific `bet_id` (`de5e0330-40d9-4c5c-aa5c-b1304aecb2fb`) that is currently marked as `pending` even though they state the payment was made. My investigation shows three payment attempts for this bet, all with `payment_id` as `NULL` and `status` as `pending`. This confirms that the webhook either never fired, was blocked, or couldn't find a matching record because it only had a `preference_id`.

I will implement a more aggressive search strategy in the sync function to reconcile these "lost" payments.

## Proposed Changes

### Backend (Server Functions & Webhooks)

#### `src/lib/palpite.functions.ts`
- Update `syncPaymentStatus` to search by ALL `preference_id`s associated with a `bet_id` if the primary `payment_id` is missing.
- Ensure the sync logic can handle the case where multiple `payments` rows exist for one `bet_id` (it should check each one against Mercado Pago).

#### `src/lib/palpite.server.ts`
- Improve `getMercadoPagoPaymentByPreference` to be more robust.

#### `src/routes/api/public/webhooks/mercadopago.ts`
- Add logic to search for a payment by `preference_id` if `external_reference` (bet_id) is missing or doesn't match, which sometimes happens in older Mercado Pago API versions or specific payment types.

### Database
- I will check if there are any orphaned payments in the database that might belong to this user but aren't linked correctly.

## Technical Details
- The database has 3 rows for `bet_id` `de5e0330...`. All have a `preference_id` but no `payment_id`.
- Mercado Pago webhooks often send the `preference_id`. If our code was expecting the `payment_id` to be present in the `payments` table to perform a match, it would fail.
- I will modify the logic to use `preference_id` as a fallback lookup key.
