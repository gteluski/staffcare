# Supabase Cutover Checklist — ghkrppjlnwaqsdfvwukr

Checklist enxuto de execução. Para detalhes, ver `MIGRATION_TO_SUPABASE.md` §13–17.

---

## Dados do Novo Projeto (preenchido)

| Campo | Valor |
|-------|-------|
| **Project Ref** | `ghkrppjlnwaqsdfvwukr` |
| **Supabase URL** | `https://ghkrppjlnwaqsdfvwukr.supabase.co` |
| **Chat Provider** | OpenAI |
| **Google OAuth Callback** | `https://ghkrppjlnwaqsdfvwukr.supabase.co/auth/v1/callback` |
| **Stripe Webhook (sandbox)** | `https://ghkrppjlnwaqsdfvwukr.supabase.co/functions/v1/payments-webhook?env=sandbox` |
| **Stripe Webhook (live)** | `https://ghkrppjlnwaqsdfvwukr.supabase.co/functions/v1/payments-webhook?env=live` |

---

## 1. Pre-cutover (Day-0)

- [ ] Backup integral do Lovable Cloud (SQL + storage)
- [ ] Snapshot git limpo + tag `pre-supabase-cutover`
- [ ] Janela de manutenção combinada (≥2h)
- [ ] Owners designados (técnico / produto / segurança)
- [ ] Decisão confirmada: provedor de chat = `openai`
- [ ] Decisão: Stripe inicia em `sandbox` ou `live`
- [ ] Whitelist admin (migration `20260423133100`) revisada
- [ ] Acesso confirmado: Supabase, Stripe, Google Cloud, DNS

---

## 2. Cutover

### 2.1 Infraestrutura
- [ ] Criar projeto Supabase com ref `ghkrppjlnwaqsdfvwukr`
- [ ] **Habilitar `pgvector`** em DB → Extensions
- [ ] `supabase link --project-ref ghkrppjlnwaqsdfvwukr`
- [ ] `supabase db push` (44 migrations)
- [ ] Validação SQL pós-push
- [ ] Criar buckets: `biblioteca` (privado), `avatars` (privado), `methodist-docs` (público)

### 2.2 Secrets (Supabase → Edge Functions → Secrets)
```
STRIPE_SANDBOX_API_KEY=sk_test_<real>
PAYMENTS_SANDBOX_WEBHOOK_SECRET=whsec_<gerado_após_2.4>

# Se go-live direto:
STRIPE_LIVE_API_KEY=sk_live_<real>
PAYMENTS_LIVE_WEBHOOK_SECRET=whsec_<real>

# Chat AI
CHAT_PROVIDER=openai
OPENAI_API_KEY=sk-<sua_key>
CHAT_MODEL=gpt-4.1-mini
```
- [ ] **NÃO criar** `LOVABLE_API_KEY`

### 2.3 Edge functions
```bash
supabase functions deploy chat
supabase functions deploy create-checkout
supabase functions deploy get-stripe-price
supabase functions deploy payments-webhook
supabase functions deploy create-portal-session
supabase functions deploy update-profile-flags

supabase functions list   # confirmar 6 active
```

### 2.4 Stripe webhook
- [ ] Criar endpoint sandbox: `https://ghkrppjlnwaqsdfvwukr.supabase.co/functions/v1/payments-webhook?env=sandbox`
- [ ] (Se aplicável) endpoint live: `https://ghkrppjlnwaqsdfvwukr.supabase.co/functions/v1/payments-webhook?env=live`
- [ ] Eventos: `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.paid`, `invoice.payment_failed`
- [ ] Copiar `whsec_` para o secret correspondente
- [ ] **Manter endpoint antigo Lovable Cloud ativo 24-72h** (rollback)

### 2.5 Auth + OAuth
- [ ] Email auth habilitado
- [ ] Google OAuth: novo Client ID + Secret no Google Cloud
- [ ] Authorized redirect: `https://ghkrppjlnwaqsdfvwukr.supabase.co/auth/v1/callback`
- [ ] Site URL: `https://staffcareapp.online`
- [ ] Redirect URLs allowlist: domínios prod + preview
- [ ] HIBP password check ativo

### 2.6 Dados + storage (manual)
- [ ] Importar tabelas na ordem: identidade → billing → domínio → biblioteca → financeiro → catálogo
- [ ] `auth.users`: plano de migração (senhas não preservadas sem Supabase Support)
- [ ] `doctrinal_chunks`: re-ingerir do bucket `methodist-docs`
- [ ] Storage: download do antigo + re-upload nos novos buckets
- [ ] Spot-check: 5 usuários, 1 avatar, 1 arquivo, 1 doc público

### 2.7 Cutover do app — PENDENTE SUA KEY
- [ ] Pegar **anon/publishable key** do novo Supabase
- [ ] Atualizar `.env`:
  - `VITE_SUPABASE_PROJECT_ID="ghkrppjlnwaqsdfvwukr"`
  - `VITE_SUPABASE_URL="https://ghkrppjlnwaqsdfvwukr.supabase.co"`
  - `VITE_SUPABASE_PUBLISHABLE_KEY="<COLE_AQUI>"`
- [ ] Verificar `supabase/config.toml`: `project_id = "ghkrppjlnwaqsdfvwukr"` ✓ já atualizado
- [ ] Rebuild + republish

---

## 3. Post-cutover (smoke tests)

- [ ] App carrega no domínio de produção
- [ ] Signup novo cria `profiles` + `profile_settings` + `subscriptions` + `user_roles`
- [ ] Login email/senha
- [ ] Login Google
- [ ] CRUD Editor / Agenda / Tarefas
- [ ] Upload biblioteca + avatar
- [ ] `/assistente` retorna stream incremental
- [ ] `/assinatura` abre Embedded Checkout
- [ ] Pagamento teste → `subscriptions.subscription_status=active` em <30s
- [ ] `create-portal-session` retorna URL
- [ ] RLS spot-check: usuário B não vê dados de A
- [ ] Logs edge functions: zero `LOVABLE_API_KEY is not configured`

---

## 4. Rollback

Critérios: smoke test falha **ou** erros recorrentes em 24h.

- [ ] Reverter `.env` para valores Lovable Cloud originais
- [ ] Reverter `supabase/config.toml` `project_id` para `qvnhqlchatyecvvpwkkx`
- [ ] Republish (≤5min — frontend volta ao backend antigo)
- [ ] Reverter webhook Stripe novo
- [ ] Documentar falha + plano de nova tentativa

> Código é forward-compatible — **não precisa reverter código**, só configuração.

---

## 5. Owner notes / manual confirmations

| Role | Nome | Data |
|------|------|------|
| Técnico | _________________ | _________ |
| Produto | _________________ | _________ |
| Segurança | _________________ | _________ |
| Decisão desativar Lovable Cloud | _________________ | _________ |
| Backup armazenado em | _________________ | |
| Tag git cutover | _________________ | |

---

**Referência:** `MIGRATION_TO_SUPABASE.md` §17 (CUTOVER REAL)
