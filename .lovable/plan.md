# Plan - Enhance "Meus Palpites" with Payment Status Indicators

Improve the "My Bets" (Meus Palpites) screen to clearly show if a bet is finalized or pending in paid leagues, with visual feedback for pending statuses as requested in `VOIDPRO-11.md`.

## User Review Required

> [!IMPORTANT]
> The "faded" effect will be applied to the scores when a payment is pending for paid leagues. Free leagues will remain normal.

- Does the "dimmed/faded" effect (50% opacity) meet your expectations for identifying pending bets?
- Should we provide a direct link to the payment page if a bet is pending? (Currently planning to add a "Pagar Agora" button if pending).

## Proposed Changes

### Frontend Enhancements

#### `src/routes/_authenticated/meus-palpites.tsx`
- Implement `isPending` logic: A bet is pending if it's in a paid league and its status is not `'paid'`.
- Apply `opacity-50 grayscale-[0.5]` style to:
    - The total score display.
    - Individual match result badges (+pts).
    - The "Seu Palpite" score containers.
- Add a status indicator badge next to the round score:
    - **Finalizado**: For paid status or free leagues.
    - **Pendente**: For non-paid status in paid leagues.
- Add a call-to-action (CTA) section at the bottom for pending bets:
    - If pending: Show "Pagamento Pendente" message with a "Concluir Pagamento" button that redirects to the payment flow.
    - If finalized: Keep the existing "Você está participando do prêmio" message.

## Technical Details

- **Pending Detection**: `const isPending = betLeague?.type !== 'free' && aposta.data?.bet?.status !== 'paid';`
- **Styling**: Use Tailwind's `opacity-50` and `grayscale` utilities to achieve the "dimmed" look for pending scores.
- **Navigation**: The "Concluir Pagamento" button will use `startPayment` from `palpite.functions.ts` (already used in the betting flow) to trigger the Mercado Pago checkout.

## Verification Plan

### Automated Tests
- N/A (UI visual changes)

### Manual Verification
1. Login as a user.
2. Create a bet in a paid league (e.g., Bronze) but do not complete the payment.
3. Navigate to "Meus Palpites".
4. Verify the scores are dimmed and a "Pendente" status is visible.
5. Click "Concluir Pagamento" and verify the Mercado Pago checkout opens.
6. Verify that for a Free league bet, scores are normal and status is "Finalizado".
