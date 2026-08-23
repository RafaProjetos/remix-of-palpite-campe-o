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

          const { getMercadoPagoPayment } = await import("@/lib/palpite.server");
          const payment = await getMercadoPagoPayment(String(paymentId));
          
          // Debugging
          console.log("Mercado Pago Webhook: Received status", payment.status, "for payment", paymentId);
          
          const betId = payment.external_reference as string | undefined;
          if (!betId) {
            console.warn("Mercado Pago Webhook: No external_reference (betId) found in payment", paymentId);
            return new Response("no reference", { status: 200 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Ensure the payment record exists or update it
          const { data: existingPayment } = await supabaseAdmin
            .from("payments")
            .select("id")
            .eq("bet_id", betId)
            .maybeSingle();

          if (existingPayment) {
            await supabaseAdmin
              .from("payments")
              .update({
                payment_id: String(paymentId),
                status: payment.status,
                raw: payment,
                updated_at: new Date().toISOString(),
              })
              .eq("bet_id", betId);
          } else {
            // It might happen that the payment was created directly in MP or the initial insert failed
            // We find the bet to get the user_id and amount
            const { data: betData } = await supabaseAdmin.from("bets").select("user_id, amount").eq("id", betId).maybeSingle();
            if (betData) {
              await supabaseAdmin.from("payments").insert({
                bet_id: betId,
                user_id: betData.user_id,
                payment_id: String(paymentId),
                status: payment.status,
                amount: betData.amount,
                raw: payment,
              });
            }
          }

          if (payment.status === "approved") {
            const { data: bet } = await supabaseAdmin
              .from("bets")
              .select("id, status")
              .eq("id", betId)
              .maybeSingle();
              
            if (bet && bet.status !== "paid") {
              const { error: updateError } = await supabaseAdmin
                .from("bets")
                .update({ 
                  status: "paid", 
                  paid_at: new Date().toISOString() 
                })
                .eq("id", betId);
              
              if (updateError) {
                console.error("Mercado Pago Webhook: Error updating bet to paid", updateError);
              } else {
                console.log("Mercado Pago Webhook: Bet", betId, "successfully marked as paid");
              }
            }
          }

          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("mercadopago webhook", error);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
