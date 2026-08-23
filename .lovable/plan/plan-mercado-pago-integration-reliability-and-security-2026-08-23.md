# Plan - Mercado Pago Integration Reliability and Security

The goal is to ensure Mercado Pago transactions are secure, correctly validated, and synchronized, without relying on hardcoded IDs for general logic.

## Technical Details

### 1. Webhook Security & Robustness
- **Payload Validation**: Enhance the webhook to handle both standard and RapidAPI-proxied Mercado Pago notifications.
- **Verification**: Implement a call-back verification to Mercado Pago's API for every webhook event to ensure the transaction state is authentic and hasn't been tampered with.
- **Duplicate Handling**: Use a database transaction or upsert with locking to prevent race conditions when multiple notifications arrive for the same payment.

### 2. Synchronization Logic Overhaul
- **Bet-centric Sync**: Refactor `syncPaymentStatus` to focus on the bet's state. It will query Mercado Pago for all payments associated with the `external_reference` (which is our `bet_id`) or `preference_id`.
- **Automatic Reconciliation**: If a payment is found as "approved" on Mercado Pago but "pending" or missing in our database, automatically create/update the payment record and mark the bet as "paid".

### 3. Database Integrity
- Ensure the `payments` table has unique constraints where appropriate (e.g., `payment_id`) to prevent duplicate records.
- Add logging for all state transitions (pending -> approved, etc.) to aid in debugging payment issues.

## Proposed Changes

### Backend (Server Functions & API)

#### [Webhook] `src/routes/api/public/webhooks/mercadopago.ts`
- Update to fetch the latest payment data directly from Mercado Pago using the received `payment_id` before updating the database.
- Improve matching logic to use `external_reference` as the primary link to `bet_id`.

#### [Server Logic] `src/lib/palpite.server.ts`
- Add a helper to fetch all payments for a specific `external_reference` (bet_id) from Mercado Pago's search API.

#### [Server Functions] `src/lib/palpite.functions.ts`
- Update `syncPaymentStatus` to use the new "search by external reference" logic for more reliable reconciliation.

### User Interface

#### [Sync Button] `src/routes/_authenticated/meus-palpites.tsx`
- No changes needed to the UI itself, as the underlying logic improvement will make the existing sync button more effective.

---

I will implement a robust verification layer that cross-references all notifications directly with the Mercado Pago API to ensure security and data accuracy.