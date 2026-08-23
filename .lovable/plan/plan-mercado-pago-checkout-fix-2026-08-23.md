# Plan - Mercado Pago Checkout Fix

The user reported that the checkout is not working for any league type. Based on the code inspection, there are a few potential points of failure:
1. The `MERCADOPAGO_ACCESS_TOKEN` might be invalid or not properly loaded in the server function.
2. The `notification_url` in the preference creation uses `params.origin`, which might not be correctly handled if it doesn't include the protocol or is blocked by Mercado Pago's requirements for HTTPS and reachable URLs.
3. The database might have constraints or RLS policies preventing the insertion into the `payments` table.
4. The `round_stats` RPC call might be failing if the function doesn't exist or returns incompatible data.

## Proposed Changes

### Backend Logic & Security

1. **Fix `createPreference` in `src/lib/palpite.server.ts`**:
   - Add detailed logging for Mercado Pago API errors to help diagnose issues in the logs.
   - Ensure the `notification_url` is a valid public URL.

2. **Fix `startPayment` in `src/lib/palpite.functions.ts`**:
   - Verify the `round_stats` RPC output handling.
   - Add error handling for the `payments` table insertion.

3. **Database Check**:
   - Verify if the `payments` table has RLS enabled and if the `authenticated` role has `INSERT` permissions.

### User Interface

1. **Enhance Error Reporting in `src/routes/_authenticated/palpitar.tsx`**:
   - Show more descriptive error messages when `salvarPalpite` fails.

## Technical Details

- **Mercado Pago Integration**: The `notification_url` must be a public HTTPS URL. In preview environments, this might be a challenge if Mercado Pago cannot reach the Lovable preview domain. However, for preference creation, it usually just needs to be a valid URL string.
- **RPC `round_stats`**: I will check the definition of this RPC to ensure it's not the bottleneck.

## Verification Plan

1. **Manual Test**: Try to initiate a payment in the preview and check the console/network tabs.
2. **Logs Inspection**: Check server-side logs for "Mercado Pago [status]" errors.
