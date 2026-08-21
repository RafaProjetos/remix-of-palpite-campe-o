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
            body?.data?.id ?? body?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
          if (!paymentId) return new Response("ignored", { status: 200 });

          const { getMercadoPagoPayment } = await import("@/lib/palpite.server");
          const payment = await getMercadoPagoPayment(String(paymentId));
          const betId = payment.external_reference as string | undefined;
          if (!betId) return new Response("no reference", { status: 200 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          await supabaseAdmin
            .from("payments")
            .update({
              payment_id: String(paymentId),
              status: payment.status,
              raw: payment,
              updated_at: new Date().toISOString(),
            })
            .eq("bet_id", betId);

          if (payment.status === "approved") {
            const bet = await supabaseAdmin.from("bets").select("round_id, status").eq("id", betId).maybeSingle();
            if (bet.data && bet.data.status !== "paid") {
              await supabaseAdmin
                .from("bets")
                .update({ status: "paid", paid_at: new Date().toISOString() })
                .eq("id", betId);
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
