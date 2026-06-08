import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

/**
 * When `LOVABLE_API_KEY` is present, requests are routed through the
 * Lovable connector gateway and the API keys above are treated as gateway
 * connection identifiers. When absent (e.g. self-hosted Supabase), the
 * same env vars MUST contain real Stripe secret keys (`sk_test_...` /
 * `sk_live_...`) and requests go directly to api.stripe.com.
 *
 * This dual-mode design keeps Lovable Cloud working unchanged while
 * enabling decoupled deployment after migration. See MIGRATION_TO_SUPABASE.md
 * → "Edge Function Decoupling" for required secrets.
 */
function isGatewayMode(): boolean {
  return !!Deno.env.get("LOVABLE_API_KEY");
}

export function getConnectionApiKey(env: StripeEnv): string {
  const key =
    env === "sandbox"
      ? Deno.env.get("STRIPE_SANDBOX_API_KEY")
      : Deno.env.get("STRIPE_LIVE_API_KEY");
  if (!key) throw new Error(`STRIPE_${env.toUpperCase()}_API_KEY is not configured`);
  return key;
}

export function createStripeClient(env: StripeEnv): Stripe {
  const apiKey = getConnectionApiKey(env);

  // Self-hosted / direct Stripe mode: STRIPE_*_API_KEY is a real sk_... secret.
  if (!isGatewayMode()) {
    return new Stripe(apiKey, {
      apiVersion: "2025-03-31.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  // Lovable Cloud gateway mode (default in this project today).
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  return new Stripe(apiKey, {
    apiVersion: "2025-03-31.basil",
    httpClient: Stripe.createFetchHttpClient((url: string | URL, init?: RequestInit) => {
      const gatewayUrl = url.toString().replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers).entries()),
          "X-Connection-Api-Key": apiKey,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
  });
}

export async function verifyWebhook(
  req: Request,
  env: StripeEnv,
): Promise<{ type: string; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret =
    env === "sandbox"
      ? Deno.env.get("PAYMENTS_SANDBOX_WEBHOOK_SECRET")
      : Deno.env.get("PAYMENTS_LIVE_WEBHOOK_SECRET");

  if (!secret) throw new Error("Webhook secret env var is not configured");
  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t") timestamp = v;
    if (k === "v1") v1Signatures.push(v);
  }
  if (!timestamp || v1Signatures.length === 0) throw new Error("Invalid signature format");

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = new TextDecoder().decode(encode(new Uint8Array(signed)));

  if (!v1Signatures.includes(expected)) throw new Error("Invalid webhook signature");
  return JSON.parse(body);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
