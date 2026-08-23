import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const bodyText = await request.text();
          let body: any = {};
          try {
            body = bodyText ? JSON.parse(bodyText) : {};
          } catch {
            body = {};
          }
          const paymentId =
            body?.data?.id ?? 
            body?.id ?? 
            url.searchParams.get("data.id") ?? 
            url.searchParams.get("id");
            
          if (!paymentId) {
            console.log("Mercado Pago Webhook: No payment ID found in body or query", bodyText);
            return new Response("ignored", { status: 200 });
          }

          const { getMercadoPagoPayment, getMercadoPagoPaymentByPreference } = await import("@/lib/palpite.server");
          
          let payment = null;
          try {
            payment = await getMercadoPagoPayment(String(paymentId));
          } catch (e) {
            console.error("Mercado Pago Webhook: Error fetching payment by ID", paymentId);
          }

          if (!payment) {
            const prefId = body?.preference_id || body?.data?.preference_id;
            if (prefId) {
              try {
                payment = await getMercadoPagoPaymentByPreference(prefId);
              } catch (e) {
                console.error("Mercado Pago Webhook: Error fetching by preference", prefId);
              }
            }
          }

          if (!payment) {
            return new Response("payment not found", { status: 200 });
          }
          
          console.log("Mercado Pago Webhook: Received status", payment.status, "for payment", payment.id || paymentId);
          
          const betId = payment.external_reference as string | undefined;
          const preferenceId = payment.preference_id as string | undefined;

          if (!betId && !preferenceId) {
            console.warn("Mercado Pago Webhook: No reference found in payment", payment.id);
            return new Response("no reference", { status: 200 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Busca o registro de pagamento existente
          let existingPayment = null;
          if (betId) {
            const { data } = await supabaseAdmin.from("payments").select("*").eq("bet_id", betId).maybeSingle();
            existingPayment = data;
          }
          
          if (!existingPayment && preferenceId) {
            const { data } = await supabaseAdmin.from("payments").select("*").eq("preference_id", preferenceId).maybeSingle();
            existingPayment = data;
          }

          const targetBetId = betId || existingPayment?.bet_id;

          if (existingPayment) {
            await supabaseAdmin
              .from("payments")
              .update({
                payment_id: String(payment.id),
                status: payment.status,
                raw: payment,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingPayment.id);
          } else if (targetBetId) {
            const { data: betData } = await supabaseAdmin.from("bets").select("user_id, amount").eq("id", targetBetId).maybeSingle();
            if (betData) {
              await supabaseAdmin.from("payments").insert({
                bet_id: targetBetId,
                user_id: betData.user_id,
                payment_id: String(payment.id),
                preference_id: preferenceId ?? null,
                status: payment.status,
                amount: betData.amount,
                raw: payment,
              });
            }
          }

          if (payment.status === "approved" && targetBetId) {
            const { data: bet } = await supabaseAdmin.from("bets").select("id, status").eq("id", targetBetId).maybeSingle();
            if (bet && bet.status !== "paid") {
              await supabaseAdmin.from("bets").update({ 
                status: "paid", 
                paid_at: payment.date_approved || new Date().toISOString() 
              }).eq("id", targetBetId);
              console.log("Mercado Pago Webhook: Bet", targetBetId, "successfully marked as paid");
            }
          }

          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("mercadopago webhook error", error);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});