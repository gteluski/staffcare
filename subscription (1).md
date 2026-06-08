---
name: Subscription and billing model
description: Native Stripe subscriptions with 7-day trial, R$79.90/month, embedded checkout
type: feature
---

## Commercial Model
- Direct public signup (no invitation required)
- 7-day free trial on account creation (auto-created via `handle_new_user_subscription` trigger)
- Monthly subscription: **R$ 79,90** per user
- Payment provider: **native Stripe** (via Lovable Cloud payments) — no Kiwify

## Stripe Setup
- Product: `staff_care_plan` / Price: `staff_care_monthly` (7990 BRL/month, recurring)
- Embedded Checkout (`ui_mode: "embedded"`) rendered inline on `/assinatura`
- Return URL: `/checkout/return?session_id={CHECKOUT_SESSION_ID}`
- Webhook handler: `payments-webhook` upserts `subscriptions` row, mirrors `current_period_end` into `paid_until` so legacy access checks keep working
- Customer portal via `create-portal-session` for managing/canceling

## Edge Functions (verify_jwt = false for all)
- `_shared/stripe.ts` — `createStripeClient`, `verifyWebhook`, `corsHeaders`
- `create-checkout` — creates embedded session, resolves price via `lookup_keys`
- `get-stripe-price` — resolves human-readable price ID to Stripe price ID
- `payments-webhook` — handles `customer.subscription.{created,updated,deleted}`
- `create-portal-session` — billing portal (requires auth)

## Database (subscriptions table)
- Existing: `subscription_status`, `paid_until`, `trial_start/end`, `payment_method`
- Added for Stripe: `stripe_subscription_id` (unique), `stripe_customer_id`, `stripe_product_id`, `stripe_price_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `environment`
- Status mapping: Stripe `canceled` → app `cancelled`; `unpaid`/`incomplete_expired` → `expired`

## Access Control
- Active trial OR active paid subscription → full access
- Expired/unpaid → blocking modal + redirect to `/assinatura`
- Unrestricted routes: `/assinatura`, `/perfil`, `/dashboard`, `/checkout/return`

## Legacy (removed)
- All Kiwify external checkout links
- Pix manual flow UI (DB function `submit_pix_payment` still exists but unused)
