import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// --- Operational logging helpers (non-blocking, never throws) ---
async function logWebhookEvent(row: {
  environment: StripeEnv;
  event_type: string;
  event_id?: string | null;
  status: "received" | "processed" | "ignored" | "failed" | "invalid_signature";
  user_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  error_message?: string | null;
  payload_summary?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("webhook_events")
      .insert({
        provider: "stripe",
        environment: row.environment,
        event_type: row.event_type,
        event_id: row.event_id ?? null,
        status: row.status,
        user_id: row.user_id ?? null,
        stripe_customer_id: row.stripe_customer_id ?? null,
        stripe_subscription_id: row.stripe_subscription_id ?? null,
        error_message: row.error_message ?? null,
        payload_summary: row.payload_summary ?? {},
        processed_at: row.status === "received" ? null : new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) console.error("logWebhookEvent insert error:", error.message);
    return data?.id ?? null;
  } catch (e) {
    console.error("logWebhookEvent failed:", (e as Error).message);
    return null;
  }
}

async function updateWebhookEvent(id: string, patch: Record<string, unknown>) {
  try {
    await supabase
      .from("webhook_events")
      .update({ ...patch, processed_at: new Date().toISOString() })
      .eq("id", id);
  } catch (e) {
    console.error("updateWebhookEvent failed:", (e as Error).message);
  }
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  let event: { type: string; data: { object: any }; id?: string };
  try {
    event = await verifyWebhook(req, env) as any;
  } catch (e) {
    // Signature failures still get logged so operators can see attack/misconfig attempts.
    await logWebhookEvent({
      environment: env,
      event_type: "unknown",
      status: "invalid_signature",
      error_message: (e as Error).message,
    });
    console.error("Webhook signature error:", e);
    return new Response("Webhook error", { status: 400 });
  }

  console.log("Stripe event:", event.type, "env:", env);

  const obj = event.data.object || {};
  const logId = await logWebhookEvent({
    environment: env,
    event_type: event.type,
    event_id: (event as any).id ?? null,
    status: "received",
    stripe_customer_id: obj.customer ?? null,
    stripe_subscription_id: obj.subscription ?? obj.id ?? null,
    user_id: obj.metadata?.userId ?? null,
    payload_summary: {
      object: obj.object,
      status: obj.status,
      mode: obj.mode,
    },
  });

  try {
    let outcome: "processed" | "ignored" = "processed";
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await markCanceled(event.data.object, env);
        break;
      case "invoice.payment_failed":
        console.log("Payment failed for:", event.data.object.id);
        break;
      default:
        console.log("Unhandled:", event.type);
        outcome = "ignored";
    }

    if (logId) await updateWebhookEvent(logId, { status: outcome });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("Webhook processing error:", e);
    if (logId) await updateWebhookEvent(logId, { status: "failed", error_message: msg });
    return new Response("Webhook error", { status: 400 });
  }
});

function mapStripeStatus(s: string): string {
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "past_due") return "past_due";
  if (s === "canceled") return "cancelled";
  if (s === "unpaid" || s === "incomplete_expired") return "expired";
  return s;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const customerId = session.customer;
  if (!userId || !customerId) return;

  await supabase
    .from("subscriptions")
    .update({
      stripe_customer_id: customerId,
      environment: env,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

async function upsertSubscription(sub: any, env: StripeEnv) {
  let userId: string | undefined = sub.metadata?.userId;

  if (!userId && sub.customer) {
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", sub.customer)
      .maybeSingle();
    userId = data?.user_id;
  }

  if (!userId) {
    console.error("No userId for subscription", sub.id);
    throw new Error(`No userId for subscription ${sub.id}`);
  }

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id;
  const productId = item?.price?.product;

  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  const status = mapStripeStatus(sub.status);

  const periodStartIso = periodStart ? new Date(periodStart * 1000).toISOString() : null;
  const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  const payload: Record<string, any> = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer,
    stripe_product_id: productId,
    stripe_price_id: priceId,
    subscription_status: status,
    payment_method: "credit_card",
    current_period_start: periodStartIso,
    current_period_end: periodEndIso,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  if (status === "active" || status === "trialing") {
    payload.paid_until = periodEndIso;
    payload.activated_at = new Date().toISOString();
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("subscriptions").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("subscriptions").insert({ ...payload, user_id: userId });
  }
}

async function markCanceled(sub: any, env: StripeEnv) {
  await supabase
    .from("subscriptions")
    .update({
      subscription_status: "cancelled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
}
