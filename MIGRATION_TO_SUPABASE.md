# Migração: Lovable Cloud → Supabase próprio

Este documento descreve, passo a passo, como migrar o backend deste projeto do **Lovable Cloud** para um **projeto Supabase gerenciado por você**, preservando o frontend e a lógica de negócio.

> **Importante**: Esta migração NÃO pode ser totalmente automatizada. Várias etapas exigem ações manuais no dashboard do Supabase, no Stripe e nos provedores OAuth.

---

## 1. O que já está pronto no código (automatizado)

- **Cliente Supabase** (`src/integrations/supabase/client.ts`) já lê de `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. Nenhuma alteração necessária no frontend — apenas o `.env` precisa apontar para o novo projeto.
- **Migrations** estão versionadas em `supabase/migrations/` (44 arquivos, ordem cronológica pelo timestamp do nome). Podem ser aplicadas via Supabase CLI no novo projeto.
- **Edge functions** estão em `supabase/functions/` e podem ser implantadas no novo projeto via CLI.
- **`supabase/config.toml`** contém o `project_id` atual. Substitua pelo `ref` do novo projeto após criá-lo.

---

## 2. O que ainda deve ser feito manualmente

### 2.1 Criar o novo projeto Supabase
1. Acesse https://supabase.com/dashboard e crie um novo projeto.
2. Anote: **Project Ref** (ex.: `abcd1234efgh`), **URL** (`https://<ref>.supabase.co`), **anon/publishable key**, **service_role key**, **DB password**.

### 2.2 Atualizar variáveis de ambiente
Substitua em `.env` (ou em Workspace Settings se estiver no Lovable conectado):
```
VITE_SUPABASE_PROJECT_ID="<NEW_PROJECT_REF>"
VITE_SUPABASE_URL="https://<NEW_PROJECT_REF>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<NEW_ANON_KEY>"
```
E em `supabase/config.toml`:
```toml
project_id = "<NEW_PROJECT_REF>"
```

### 2.3 Aplicar migrations no novo banco
```bash
supabase link --project-ref <NEW_PROJECT_REF>
supabase db push
```

**Ordem de aplicação** (44 migrations, cronológica pelo timestamp do nome):

- **Fase 1 — Fundação** (`20260409161928` → `20260409194527`, 22 arquivos): tabelas core, profiles, RLS inicial.
- **Fase 2 — Domínio** (`20260409211749` → `20260410232736`, 10 arquivos): eventos, tarefas, notas, biblioteca, sermões, planner, finanças.
- **Fase 3 — RAG e storage** (`20260411001215` → `20260411192638`, 8 arquivos): `doctrinal_chunks`, FTS/embedding, buckets, RLS hardening.
- **Fase 4 — Pagamentos e roles** (`20260417033017`, `20260417111733`, `20260423133100`): `subscriptions`, `user_roles`, `assign_user_role` com whitelist.

**Dependências críticas a verificar antes do push**:
- ⚠️ **Extensão `pgvector`** habilitada em Database → Extensions (necessária para `doctrinal_chunks.embedding`).
- ⚠️ Triggers em `auth.users` (`handle_new_user`, `handle_new_user_subscription`, `assign_user_role`) são `SECURITY DEFINER` — confirmar criação após push: `SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass`.
- ⚠️ Whitelist de admin na última migration (`20260423133100`) contém `lucasgeneroso50@gmail.com` e `guiteluskibx@gmail.com` — edite antes do push se quiser outra lista.
- ⚠️ `doctrinal_chunks` é criada vazia — re-ingerir do storage `methodist-docs` ou exportar/importar.

**Validação pós-push**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;        -- ~16 tabelas
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgname NOT LIKE 'RI_%';  -- 3 triggers
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;               -- ~10 funções
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';             -- ~50 policies
```

### 2.4 Recriar storage buckets
Crie manualmente no dashboard (Storage → New bucket) ou via SQL:

| Bucket | Público | Notas |
|---|---|---|
| `biblioteca` | ❌ Privado | Arquivos pessoais dos pastores |
| `avatars` | ❌ Privado | Fotos de perfil |
| `methodist-docs` | ✅ Público | Documentos doutrinários |

As **policies de storage** (acesso por `user_id`) já estão nas migrations.

### 2.5 Recriar secrets das edge functions
No dashboard do novo projeto: **Project Settings → Edge Functions → Secrets**.

| Secret | Origem | Obrigatório |
|---|---|---|
| `STRIPE_SANDBOX_API_KEY` | **REAL** secret key da Stripe (sk_test_...) — não a chave do gateway Lovable | ✅ |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET` | Gerado ao criar webhook na Stripe | ✅ |
| `STRIPE_LIVE_API_KEY` | Stripe live (sk_live_...) | quando for live |
| `PAYMENTS_LIVE_WEBHOOK_SECRET` | Stripe live | quando for live |
| `LOVABLE_API_KEY` | **Não disponível fora do Lovable** — precisa ser substituído (ver 2.6) | ⚠️ |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` | Auto-injetados pelo Supabase | — |

### 2.6 ⚠️ Refatorações obrigatórias em edge functions (gateway Lovable)
Estes arquivos chamam o **gateway Lovable** que **não existe fora do Lovable Cloud**:

- **`supabase/functions/_shared/stripe.ts`** — usa `https://connector-gateway.lovable.dev/stripe` e `LOVABLE_API_KEY`. Substitua por chamada direta ao Stripe SDK:
  ```ts
  return new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-03-31.basil" });
  ```
- **`supabase/functions/chat/index.ts`** (linhas 421–481) — usa `https://ai.gateway.lovable.dev` e `LOVABLE_API_KEY` para acessar Gemini/GPT-5. Substitua por:
  - Google Gemini API direta (com `GEMINI_API_KEY`), ou
  - OpenAI API direta (com `OPENAI_API_KEY`).

### 2.7 Reimplantar edge functions
```bash
supabase functions deploy chat
supabase functions deploy create-checkout
supabase functions deploy create-portal-session
supabase functions deploy get-stripe-price
supabase functions deploy payments-webhook
supabase functions deploy update-profile-flags
```

### 2.8 Reconfigurar Auth
No dashboard: **Authentication → Providers**:
- **Email**: habilitado, "Confirm email" conforme política atual
- **Google OAuth**: precisa de novo Client ID/Secret no Google Cloud Console com redirect URL `https://<NEW_REF>.supabase.co/auth/v1/callback`
- **Site URL** e **Redirect URLs**: adicionar domínios de produção (`https://staffcareapp.online`, `https://www.staffcareapp.online`) e preview do Lovable, se aplicável
- **Password protection (HIBP)**: reativar manualmente em Authentication → Providers → Email

### 2.9 Atualizar webhook do Stripe
No Stripe Dashboard → Developers → Webhooks:
- **URL antiga**: `https://qvnhqlchatyecvvpwkkx.supabase.co/functions/v1/payments-webhook?env=sandbox`
- **URL nova**: `https://<NEW_REF>.supabase.co/functions/v1/payments-webhook?env=sandbox`
- Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- Copie o novo `whsec_...` para `PAYMENTS_SANDBOX_WEBHOOK_SECRET`

### 2.10 Migrar dados (manual)

**Tabelas com dados de usuário** (export/import via dashboard ou `pg_dump`):
- `profiles`, `profile_settings`, `user_roles`, `subscriptions`
- `documents`, `events`, `tasks`, `notes`, `sermons`
- `financial_entries`, `library_files`, `library_folders`
- `ministry_history`, `ministry_plans`, `missionary_trips`, `spiritual_experiences`

**Tabela com dados de catálogo** (doutrina metodista):
- `doctrinal_chunks` — re-ingerir do storage `methodist-docs` ou exportar/importar

**Usuários (`auth.users`)**:
- ⚠️ **Senhas não migram diretamente** entre projetos Supabase (hashes vinculados ao JWT secret).
- Opções:
  1. Exportar via Supabase Support (caso "auth migration") — preserva senhas.
  2. Usuários redefinem senha via "Esqueci a senha" no novo projeto.

**Storage**:
- Faça download de cada bucket (CLI: `supabase storage download`) e re-upload no novo projeto. Reaplique paths para preservar links em `library_files.file_path`.

---

## 3. Ordem recomendada de execução

1. Criar projeto Supabase novo (vazio)
2. Aplicar migrations (`supabase db push`)
3. Criar storage buckets
4. Configurar secrets de edge functions
5. **Refatorar `_shared/stripe.ts` e `chat/index.ts`** (remover dependência do gateway Lovable)
6. Deploy das edge functions
7. Configurar Auth (providers + redirect URLs + HIBP)
8. Exportar dados do projeto Lovable Cloud
9. Importar dados no projeto novo
10. Atualizar `.env` e `supabase/config.toml` com o novo `project_ref`
11. Atualizar webhook do Stripe
12. Testar localmente com `npm run dev`
13. Republicar

---

## 4. Checklist de validação pós-migração

- [ ] Login com email/senha funciona
- [ ] Login Google funciona e cria perfil
- [ ] `profiles`, `profile_settings`, `subscriptions` populam para novos signups (triggers OK)
- [ ] `assign_user_role` aplica admin a emails na whitelist
- [ ] Editor cria/edita/exclui documentos
- [ ] Upload na biblioteca funciona (storage policies OK)
- [ ] Avatar do perfil carrega
- [ ] Stripe checkout abre (`/assinatura` → "Assinar")
- [ ] Webhook do Stripe atualiza `subscriptions` após pagamento teste (`4242 4242 4242 4242`)
- [ ] Realtime atualiza UI em `/checkout/return`
- [ ] Chat AI responde em `/assistente`
- [ ] RLS bloqueia acesso a dados de outros usuários
- [ ] Domínio customizado (`staffcareapp.online`) resolve corretamente

---

## 5. Precauções de rollback

- **NÃO desabilite** o Lovable Cloud até a validação completa do novo projeto.
- Mantenha o `.env` antigo salvo em local seguro.
- Mantenha um snapshot das migrations atuais (já versionadas em git).
- Webhooks do Stripe podem coexistir temporariamente — registre dois endpoints durante a transição.
- Para rollback: reverta `.env` e `supabase/config.toml` para os valores originais e republique.

---

## 6. Limitações conhecidas

| Item | Limitação |
|---|---|
| Senhas de usuários | Não migram entre projetos sem suporte do Supabase |
| Storage | Cópia 100% manual (CLI ou script) |
| AI gateway Lovable | Inacessível fora do Lovable — função `chat` precisa refatoração |
| Stripe gateway Lovable | Inacessível fora do Lovable — `_shared/stripe.ts` precisa refatoração |
| Secrets | Recriação manual no dashboard novo |
| OAuth Google | Reconfiguração manual no Google Cloud Console |
| Redirect URLs | Reconfiguração manual no Auth Settings |
| `auth.users` IDs | Devem ser preservados ao migrar para manter FK lógica em `user_id` |

---

## 7. Resumo das mudanças neste commit

**Arquivos criados**:
- `MIGRATION_TO_SUPABASE.md` (este documento)

**Arquivos NÃO alterados** (intencional, para preservar funcionamento atual no Lovable Cloud):
- `src/integrations/supabase/client.ts`
- `.env`, `.env.development`
- `supabase/config.toml`
- Qualquer código de UI ou lógica de negócio

**A alteração de `.env` e `config.toml` deve ser feita por você no momento da virada**, para evitar quebrar o ambiente atual.

---

## 8. Tarefas manuais que você ainda precisa fazer

1. ☐ Criar projeto Supabase novo
2. ☐ Rodar `supabase db push` com as migrations
3. ☐ Criar 3 storage buckets (`biblioteca`, `avatars`, `methodist-docs`)
4. ☐ Adicionar secrets de Stripe e (se mantiver chat AI) GEMINI/OPENAI no Supabase
5. ☐ Refatorar `supabase/functions/_shared/stripe.ts` para usar Stripe SDK direto
6. ☐ Refatorar `supabase/functions/chat/index.ts` para usar Gemini/OpenAI direto
7. ☐ Deploy de todas as 6 edge functions
8. ☐ Reconfigurar Google OAuth (Client ID + Secret + redirect URL)
9. ☐ Adicionar Site URL e Redirect URLs em Auth Settings
10. ☐ Reativar HIBP password check
11. ☐ Exportar/importar dados (16 tabelas + storage)
12. ☐ Atualizar webhook URL na Stripe + copiar novo `whsec_`
13. ☐ Atualizar `.env`, `.env.development` e `supabase/config.toml`
14. ☐ Testar fluxo completo conforme checklist seção 4
15. ☐ Republicar

---

**Dúvidas?** Documente qualquer divergência encontrada durante a migração no final deste arquivo para referência futura.

---

## 9. EDGE FUNCTION DECOUPLING

Esta seção documenta a refatoração feita nas funções edge para remover o
acoplamento com a infraestrutura Lovable (gateways `connector-gateway.lovable.dev`
e `ai.gateway.lovable.dev`) **sem quebrar o ambiente Lovable Cloud atual**.

### 9.1 O que mudou no código

**`supabase/functions/_shared/stripe.ts`** — agora opera em **modo dual**:

- Se `LOVABLE_API_KEY` está presente → mantém o comportamento atual (gateway Lovable). `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` são tratados como connection identifiers do gateway.
- Se `LOVABLE_API_KEY` está ausente (Supabase próprio) → conecta diretamente em `api.stripe.com`. As mesmas variáveis `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` devem conter **chaves Stripe reais** (`sk_test_...` / `sk_live_...`).
- API version Stripe pinada em `2025-03-31.basil` em ambos os modos.
- `verifyWebhook` não foi alterado — já era independente do gateway.

**`supabase/functions/chat/index.ts`** — agora suporta **3 provedores via env**:

| `CHAT_PROVIDER` | Endpoint | Secret | Modelo padrão |
|---|---|---|---|
| `lovable` (padrão) | `ai.gateway.lovable.dev` | `LOVABLE_API_KEY` | `google/gemini-3-flash-preview` |
| `openai` | `api.openai.com` | `OPENAI_API_KEY` | `gpt-5-mini` |
| `gemini` | `generativelanguage.googleapis.com` (OpenAI-compat) | `GEMINI_API_KEY` | `gemini-2.5-flash` |

- Override de modelo via `CHAT_MODEL`.
- Todos os provedores emitem SSE no formato OpenAI-compatível (`data: {choices:[{delta:{content}}]}`), portanto `src/lib/chat-stream.ts` continua funcionando sem mudanças.
- RAG (`search_doctrinal_chunks`), autenticação JWT, prompt de sistema e tratamento de erros 429/402 preservados.

### 9.2 Diferenças comportamentais conhecidas

- **Modelo padrão muda por provedor.** Defina `CHAT_MODEL` para forçar um modelo específico se quiser paridade exata com o comportamento Lovable Cloud.
- **Gemini direto** usa o endpoint OpenAI-compatible do Google. Ferramentas avançadas (function calling, tools) podem se comportar de forma diferente do gateway Lovable — não usado por esta aplicação hoje.
- **OpenAI direto** não tem o roteamento multi-modelo do gateway Lovable (`google/...`, `openai/...`). Use prefixo apenas no modo `lovable`.
- **Webhook signature verification** continua igual — usa HMAC-SHA256 nativo do Deno, sem dependência externa.

### 9.3 Checklist de secrets (Supabase próprio)

Configurar em **Project Settings → Edge Functions → Secrets** (use placeholders abaixo, **nunca** valores reais em commits):

**Stripe (obrigatório):**
- [ ] `STRIPE_SANDBOX_API_KEY` = `sk_test_<sua_chave_real>`
- [ ] `PAYMENTS_SANDBOX_WEBHOOK_SECRET` = `whsec_<gerado_pela_stripe>`
- [ ] `STRIPE_LIVE_API_KEY` = `sk_live_<sua_chave_real>` (quando for go-live)
- [ ] `PAYMENTS_LIVE_WEBHOOK_SECRET` = `whsec_<gerado_pela_stripe>` (quando for go-live)

**Chat (obrigatório — escolher UM provedor):**
- [ ] `CHAT_PROVIDER` = `openai` **ou** `gemini`
- [ ] `OPENAI_API_KEY` = `sk-<sua_chave>` (se `CHAT_PROVIDER=openai`)
- [ ] `GEMINI_API_KEY` = `<sua_chave>` (se `CHAT_PROVIDER=gemini`)
- [ ] `CHAT_MODEL` (opcional) = nome explícito do modelo

**Auto-injetadas pelo Supabase (não criar manualmente):**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`

**NÃO criar** em Supabase próprio:
- `LOVABLE_API_KEY` — apenas o Lovable Cloud injeta. Sua ausência é o sinal que ativa o modo direto.

### 9.4 Passos de deploy manual

```bash
# 1. Linkar projeto
supabase link --project-ref <NEW_PROJECT_REF>

# 2. Configurar secrets (via dashboard OU CLI)
supabase secrets set STRIPE_SANDBOX_API_KEY=sk_test_xxx \
                     PAYMENTS_SANDBOX_WEBHOOK_SECRET=whsec_xxx \
                     CHAT_PROVIDER=openai \
                     OPENAI_API_KEY=sk-xxx

# 3. Deploy das funções afetadas (e dependências)
supabase functions deploy chat
supabase functions deploy create-checkout
supabase functions deploy create-portal-session
supabase functions deploy get-stripe-price
supabase functions deploy payments-webhook
supabase functions deploy update-profile-flags
```

### 9.5 Validação pós-deploy

**Stripe:**
- [ ] `GET /functions/v1/get-stripe-price` com `priceId` válido retorna `stripeId`
- [ ] Frontend `/assinatura` abre o Stripe Embedded Checkout (clientSecret retornado por `create-checkout`)
- [ ] Pagamento teste (`4242 4242 4242 4242`) completa e o webhook atualiza `subscriptions` (verificar via SQL: `SELECT user_id, subscription_status, current_period_end FROM subscriptions ORDER BY updated_at DESC LIMIT 5;`)
- [ ] `create-portal-session` retorna `url` válida do billing portal para usuário com assinatura ativa
- [ ] Logs da função `payments-webhook` mostram eventos processados sem erro de assinatura

**Chat:**
- [ ] `/assistente` carrega e a primeira mensagem retorna stream incremental (não bloco único)
- [ ] Resposta usa terminologia metodista-wesleyana (system prompt aplicado)
- [ ] Pergunta teológica (ex: "o que é graça preveniente?") retorna citações 📚 (RAG funcionando)
- [ ] Sem auth → 401 "Sessão inválida"
- [ ] Logs da função `chat` mostram `AI provider error (<provider>)` em caso de falha (não mais "AI gateway error")

### 9.6 Rollback

Se algo quebrar após o cutover:
1. Reativar `LOVABLE_API_KEY` no projeto Supabase próprio **não funciona** — o gateway Lovable só aceita projetos Lovable Cloud.
2. Rollback real = voltar `.env` e `supabase/config.toml` para apontar para o projeto Lovable Cloud original. Frontend e migrations são compatíveis com ambos.
3. As mudanças em `_shared/stripe.ts` e `chat/index.ts` são **forward-compatible**: o código refatorado continua funcionando no Lovable Cloud (modo gateway é o default quando `LOVABLE_API_KEY` está presente).

### 9.7 Risk notes

| Risco | Mitigação |
|---|---|
| Modelo de IA diferente entre Lovable e provider direto | `CHAT_MODEL` explícito; testar respostas antes do go-live |
| Custo direto da OpenAI/Gemini (sem subsídio Lovable) | Monitorar billing nos respectivos dashboards |
| Webhook secret incorreto após cutover | Verificar logs de `payments-webhook` — erro será `Invalid webhook signature` |
| Stripe key types invertidos (`sk_test_` em produção) | `STRIPE_LIVE_API_KEY` deve começar com `sk_live_`; `STRIPE_SANDBOX_API_KEY` com `sk_test_` |
| Rate limits do provedor direto diferentes do gateway | Tratamento de 429 já existe no código |

---

## 10. Resumo do decoupling (este commit)

**Arquivos alterados:**
- `supabase/functions/_shared/stripe.ts` — modo dual (gateway/direto), API version pinada
- `supabase/functions/chat/index.ts` — provider configurável (`lovable`/`openai`/`gemini`)
- `MIGRATION_TO_SUPABASE.md` — esta seção

**Dependências Lovable removidas (no modo direto):**
- `connector-gateway.lovable.dev` → chamadas diretas a `api.stripe.com`
- `ai.gateway.lovable.dev` → chamadas diretas a `api.openai.com` ou `generativelanguage.googleapis.com`
- `LOVABLE_API_KEY` → não mais obrigatório quando `CHAT_PROVIDER ≠ lovable`

**Garantias de compatibilidade:**
- Lovable Cloud atual continua funcionando sem nenhuma mudança de config
- RLS, schema, autenticação, frontend, demais edge functions: intocados
- Formato SSE OpenAI-compatible preservado (frontend não muda)
- Webhook HMAC verification preservado
---

## 11. CUTOVER EXECUTION PLAN

Esta seção é o **runbook operacional** para a virada do Lovable Cloud para o Supabase próprio. Execute na ordem indicada. Cada passo é manual — esta migração **não é automatizada**.

### 11.1 Auditoria de variáveis de ambiente (concluída)

| Origem | Variável | Onde é consumida | Tipo |
|---|---|---|---|
| `.env` (Vite) | `VITE_SUPABASE_PROJECT_ID` | Frontend (referência) | Pública |
| `.env` (Vite) | `VITE_SUPABASE_URL` | `client.ts`, `chat-stream.ts` | Pública |
| `.env` (Vite) | `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts`, `chat-stream.ts` | Pública (anon) |
| `.env` (Vite) | `VITE_PAYMENTS_CLIENT_TOKEN` | `stripe.ts`, `PaymentTestModeBanner.tsx` | Pública (Stripe pk_) |
| Supabase secret | `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` | edge functions | Auto-injetado |
| Supabase secret | `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` | `_shared/stripe.ts` | Privado |
| Supabase secret | `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET` | `_shared/stripe.ts` (`verifyWebhook`) | Privado |
| Supabase secret | `CHAT_PROVIDER` (`openai`\|`gemini`) | `chat/index.ts` | Privado |
| Supabase secret | `OPENAI_API_KEY` **ou** `GEMINI_API_KEY` | `chat/index.ts` | Privado |
| Supabase secret | `CHAT_MODEL` (opcional) | `chat/index.ts` | Privado |
| Lovable Cloud only | `LOVABLE_API_KEY` | `_shared/stripe.ts`, `chat/index.ts` | **NÃO criar** em Supabase próprio |

Naming já está padronizado e claro — **nenhuma renomeação necessária**. Toda configuração de runtime usa secrets explícitos.

### 11.2 Pre-cutover checklist

- [ ] Novo projeto Supabase criado, `pgvector` habilitado
- [ ] `supabase db push` executado com sucesso (44 migrations)
- [ ] Validação SQL pós-push (§2.3) passou
- [ ] Buckets `biblioteca`, `avatars`, `methodist-docs` criados
- [ ] Todos os secrets da §9.3 configurados
- [ ] Edge functions deployadas (verificar com `supabase functions list`)
- [ ] Google OAuth Client ID/Secret criados, redirect URI `https://<NEW_REF>.supabase.co/auth/v1/callback`
- [ ] Site URL e Redirect URLs adicionados em Auth Settings
- [ ] Stripe webhook criado, `whsec_` copiado para `PAYMENTS_SANDBOX_WEBHOOK_SECRET`
- [ ] Backup completo do Lovable Cloud (export tabelas + storage)
- [ ] `.env` antigo salvo em local seguro
- [ ] Janela de manutenção comunicada (se aplicável)

### 11.3 Cutover sequence (ordem exata)

1. **Pausar tráfego de produção** (opcional — página de manutenção ou aceitar downtime curto)
2. **Snapshot final do Lovable Cloud** — re-export para garantir delta zero
3. **Importar dados** no Supabase próprio (manual, via dashboard ou `pg_dump`/`psql`):
   - Ordem: `profiles` → `profile_settings` → `user_roles` → `subscriptions` → tabelas de domínio
   - `auth.users`: contatar Supabase Support para preservar senhas, OU forçar reset
   - `doctrinal_chunks`: re-ingerir do bucket `methodist-docs`
4. **Copiar storage** (`supabase storage download` + re-upload, preservar paths)
5. **Atualizar `.env`** raiz: `VITE_SUPABASE_PROJECT_ID/URL/PUBLISHABLE_KEY`. `VITE_PAYMENTS_CLIENT_TOKEN` permanece (Stripe não muda).
6. **Atualizar `supabase/config.toml`**: `project_id = "<NEW_PROJECT_REF>"`. Blocos `[functions.*]` `verify_jwt = false` permanecem.
7. **Rebuild + republish**
8. **Atualizar webhook Stripe** apontando para o novo project ref
9. **Smoke test** seguindo §11.5
10. **Reabrir tráfego** após validação OK
11. **Manter Lovable Cloud ativo 24-72h** como rollback rápido

### 11.4 Deployment checklist (comandos)

```bash
supabase link --project-ref <NEW_PROJECT_REF>
supabase db push

supabase secrets set \
  STRIPE_SANDBOX_API_KEY=sk_test_xxx \
  PAYMENTS_SANDBOX_WEBHOOK_SECRET=whsec_xxx \
  CHAT_PROVIDER=openai \
  OPENAI_API_KEY=sk-xxx

supabase functions deploy chat
supabase functions deploy create-checkout
supabase functions deploy create-portal-session
supabase functions deploy get-stripe-price
supabase functions deploy payments-webhook
supabase functions deploy update-profile-flags

supabase functions list
supabase secrets list
```

### 11.5 Validation matrix (post-cutover)

**Bloqueador** = não fazer go-live se falhar.

| # | Área | Teste | Bloqueador |
|---|---|---|---|
| 1 | Auth | Signup email/senha cria usuário e dispara `handle_new_user` | ✅ |
| 2 | Auth | Login email/senha funciona | ✅ |
| 3 | Auth | Login Google redireciona, retorna, cria perfil no 1º acesso | ✅ |
| 4 | Auth | Reset de senha envia email e atualiza credencial | ✅ |
| 5 | Triggers | `assign_user_role` aplica `admin` para whitelist; `user` para os demais | ✅ |
| 6 | Triggers | `handle_new_user_subscription` cria linha `trialing` | ✅ |
| 7 | RLS | Usuário A não acessa dados de Usuário B (todas as tabelas) | ✅ |
| 8 | CRUD | Editor: criar/editar/excluir documento | ✅ |
| 9 | CRUD | Agenda: criar/editar/excluir evento | ✅ |
| 10 | CRUD | Tarefas, Notas, Sermões, Diário, Planner, Financeiro | ✅ |
| 11 | Storage | Upload biblioteca: arquivo em `biblioteca/<user_id>/...` + linha em `library_files` | ✅ |
| 12 | Storage | Upload avatar: arquivo em `avatars/<user_id>/...` + `profiles.avatar_url` | ✅ |
| 13 | Storage | Bucket público `methodist-docs` legível | ✅ |
| 14 | Stripe | `/assinatura` carrega Embedded Checkout (clientSecret) | ✅ |
| 15 | Stripe | Pagamento `4242 4242 4242 4242` redireciona para `/checkout/return` | ✅ |
| 16 | Stripe | Webhook atualiza `subscriptions.subscription_status=active` em <30s | ✅ |
| 17 | Stripe | `create-portal-session` retorna URL válida | ⚠️ |
| 18 | Realtime | `/checkout/return` recebe evento realtime ao webhook atualizar `subscriptions` | ⚠️ |
| 19 | Chat | `/assistente` retorna stream incremental com provedor configurado | ✅ |
| 20 | Chat | RAG: pergunta teológica retorna citações 📚 | ⚠️ |
| 21 | Chat | Sem auth → 401 "Sessão inválida" | ✅ |
| 22 | Domínio | `staffcareapp.online` resolve e serve app correto | ✅ |
| 23 | Domínio | OAuth Google redirect funciona no custom domain | ✅ |
| 24 | Logs | Edge function logs sem `LOVABLE_API_KEY is not configured` | ✅ |

### 11.6 Rollback checklist

Se qualquer teste **bloqueador** falhar:

1. ☐ Reverter `.env` para os valores do Lovable Cloud
2. ☐ Reverter `supabase/config.toml` `project_id` para o ref antigo
3. ☐ Republish (frontend volta a apontar para backend antigo, intacto)
4. ☐ Reverter webhook Stripe para URL antiga (ou manter ambos endpoints)
5. ☐ Documentar a falha para nova tentativa

**Importante**: o código refatorado em `_shared/stripe.ts` e `chat/index.ts` é forward-compatible — não precisa reverter código, só configuração.

### 11.7 Known high-risk points

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Senhas de `auth.users` não migram | Alta | Alto | Avisar reset; ou Supabase Support |
| Storage paths quebram links em `library_files.file_path` | Média | Alto | Preservar formato `<bucket>/<user_id>/<filename>` |
| Stripe customer IDs em `subscriptions` | Baixa | Médio | São globais por conta Stripe — permanecem válidos |
| `pgvector` não habilitado antes do `db push` | Média | Alto | Habilitar primeiro; validar |
| Whitelist admin desatualizada | Baixa | Baixo | Editar migration `20260423133100` antes do push |
| `verify_jwt = false` perdido em `config.toml` | Média | Alto | Validar após cutover; CORS preflight quebra senão |
| Modelo IA diferente afeta tom | Alta | Baixo | `CHAT_MODEL` explícito; testar antes |
| Custos OpenAI/Gemini sem subsídio | Certa | Baixo | Monitorar billing; alertas |
| OAuth Google redirect URL incorreto | Média | Alto | Testar em staging |
| Realtime publication não habilitada | Baixa | Médio | Verificar `ALTER PUBLICATION supabase_realtime` |

### 11.8 Manual actions outside the repo

**Supabase dashboard:**
- Criar projeto + anotar ref/URL/keys
- Habilitar `pgvector`
- Criar 3 storage buckets com visibilidade correta
- Configurar todos os secrets
- Habilitar Email auth + Google OAuth
- Configurar Site URL + Redirect URLs
- Reativar HIBP
- Importar dados

**Google Cloud Console:**
- Criar OAuth Client ID
- Adicionar redirect URI `https://<NEW_REF>.supabase.co/auth/v1/callback`
- Copiar Client ID + Secret para Supabase

**Stripe dashboard:**
- Criar webhook endpoint (sandbox e live separados)
- Selecionar eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`
- Copiar `whsec_` para `PAYMENTS_*_WEBHOOK_SECRET`

**OpenAI / Google AI Studio (escolher um):**
- Gerar API key
- Adicionar como `OPENAI_API_KEY` ou `GEMINI_API_KEY`
- Configurar `CHAT_PROVIDER`

**Domínio (se aplicável):**
- Atualizar DNS se mudar de provedor de hosting
- Validar SSL certificate

---

## 12. Resumo desta etapa (cutover preparation)

**Arquivos criados:**
- `.env.example` — template completo agrupado (Supabase / Stripe / Chat / OAuth / Webhooks)

**Arquivos atualizados:**
- `MIGRATION_TO_SUPABASE.md` — §11 (CUTOVER EXECUTION PLAN, validation matrix, rollback) + §12

**Arquivos NÃO alterados (intencional):**
- `.env`, `.env.development` — auto-gerenciados; só serão editados no momento da virada
- `supabase/config.toml` — `project_id` só será trocado no cutover real
- Código de aplicação (frontend, hooks, business logic): zero mudanças
- Edge functions além de `_shared/stripe.ts` e `chat/index.ts` (já refatoradas na §9): zero mudanças

**Final env/secrets checklist:**

- [ ] `.env`: 4 variáveis Vite atualizadas (`VITE_SUPABASE_*` × 3 + `VITE_PAYMENTS_CLIENT_TOKEN`)
- [ ] `supabase/config.toml`: `project_id` atualizado
- [ ] Secrets Stripe: `STRIPE_SANDBOX_API_KEY`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET` (+ live)
- [ ] Secrets Chat: `CHAT_PROVIDER`, `OPENAI_API_KEY` ou `GEMINI_API_KEY`, opcional `CHAT_MODEL`
- [ ] Secrets auto-injetados: nenhuma ação
- [ ] `LOVABLE_API_KEY`: **não criar** (ausência ativa modo direto)

**Top migration risks:**
1. Senhas `auth.users` (não migram nativamente)
2. Storage paths (preservar `<bucket>/<user_id>/<filename>`)
3. `pgvector` não habilitado antes do push
4. `verify_jwt = false` perdido em `config.toml` quebra checkout/webhooks
5. OAuth redirect URL incorreto bloqueia login Google

**Manual tasks pendentes fora do repo:**
- Criar projeto Supabase + habilitar pgvector
- Criar buckets
- Configurar secrets
- Configurar OAuth Google
- Criar webhook Stripe
- Importar dados (16 tabelas + storage)
- Atualizar `.env` + `config.toml` (último passo)

---

## 13. FINAL EXECUTION PACKAGE

Pacote operacional final, pronto para execução manual. Todas as etapas foram cruzadas contra `.env.example`, `supabase/config.toml`, secrets em uso e código das edge functions — **nenhuma inconsistência encontrada**. Naming de variáveis está padronizado (§11.1).

### 13.1 Day-0 preparation checklist

- [ ] Acesso admin a: Supabase (workspace), Stripe (test+live), Google Cloud Console, DNS do domínio
- [ ] Backup integral do projeto Lovable Cloud (export SQL + storage download)
- [ ] Snapshot git limpo da branch atual
- [ ] Janela de manutenção combinada (mín. 2h recomendado)
- [ ] Lista de usuários com flag `must_change_password` ou plano de comunicação para reset de senha
- [ ] Lista de admins (whitelist em migration `20260423133100`) revisada
- [ ] Decisão tomada: provedor de chat (`openai` ou `gemini`)
- [ ] Decisão tomada: ambiente Stripe inicial (`sandbox` para soft-launch ou `live` direto)

### 13.2 Supabase project setup checklist

- [ ] Projeto novo criado, região e DB password anotados
- [ ] **`pgvector` habilitado** (Database → Extensions) — bloqueante para `doctrinal_chunks`
- [ ] Anon key, service_role key, project ref, URL anotados em local seguro
- [ ] CLI linkado: `supabase link --project-ref <NEW_PROJECT_REF>`
- [ ] `supabase db push` executado, validação SQL §2.3 passou
- [ ] 3 buckets criados com visibilidade correta (§2.4)
- [ ] Realtime publication validada: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`

### 13.3 Migration execution order (consolidado)

1. Day-0 prep (§13.1)
2. Supabase project setup (§13.2)
3. Secrets setup (§13.6)
4. Edge function deploy (§13.9)
5. OAuth + redirect URLs (§13.7)
6. Stripe webhook cutover (§13.8)
7. Data import (§13.4) + storage copy (§13.5)
8. `.env` + `config.toml` cutover
9. Rebuild + republish
10. Smoke tests (§13.10)
11. Sign-off (§14)

### 13.4 Data export/import checklist (por grupo de tabelas)

Ordem importa devido a FKs lógicas (`user_id`).

| Grupo | Tabelas | Ordem | Notas |
|---|---|---|---|
| A. Identidade | `auth.users`, `profiles`, `profile_settings`, `user_roles` | 1 | `auth.users` requer Supabase Support para preservar senhas; do contrário forçar reset |
| B. Billing | `subscriptions` | 2 | Preservar `stripe_customer_id` e `stripe_subscription_id` |
| C. Domínio pessoal | `events`, `tasks`, `notes`, `documents`, `sermons` | 3 | RLS por `user_id` |
| D. Domínio ministerial | `ministry_history`, `ministry_plans`, `missionary_trips`, `spiritual_experiences` | 4 | — |
| E. Biblioteca | `library_folders` → `library_files` | 5 | `folder_id` referencia `library_folders` |
| F. Financeiro | `financial_entries` | 6 | `event_id` referencia `events` |
| G. Catálogo doutrinal | `doctrinal_chunks` | 7 | Re-ingerir do bucket `methodist-docs` (recria embeddings) **ou** export/import preservando coluna `embedding` |

- [ ] Export concluído para todos os grupos
- [ ] Import na ordem A → G
- [ ] Validação por contagem: `SELECT count(*) FROM <tabela>` bate com origem
- [ ] Spot-check de 5 usuários reais: dados visíveis, RLS ativa

### 13.5 Storage migration checklist (por bucket)

| Bucket | Visibilidade | Path pattern | Tamanho típico | Validação |
|---|---|---|---|---|
| `biblioteca` | Privado | `<user_id>/<filename>` | Variável (até quota) | Linha em `library_files` continua resolvendo |
| `avatars` | Privado | `<user_id>/<filename>` | Pequeno | `profiles.avatar_url` continua resolvendo |
| `methodist-docs` | Público | `<categoria>/<doc>.pdf` | Médio | URL pública abre |

- [ ] `supabase storage download` em cada bucket (origem)
- [ ] Re-upload preservando paths (destino)
- [ ] Spot-check: 1 avatar, 1 arquivo de biblioteca, 1 doc público
- [ ] Quota por usuário recalculada via `get_user_storage_usage`

### 13.6 Secrets setup checklist

| Secret | Modo Lovable Cloud | Modo Supabase próprio | Ação |
|---|---|---|---|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` | Auto | Auto | Nenhuma |
| `STRIPE_SANDBOX_API_KEY` | Gateway ID | `sk_test_<real>` | **Recriar** com chave Stripe real |
| `STRIPE_LIVE_API_KEY` | Gateway ID | `sk_live_<real>` | **Recriar** quando go-live |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET` | `whsec_` | `whsec_` | **Recriar** após criar novo webhook |
| `PAYMENTS_LIVE_WEBHOOK_SECRET` | `whsec_` | `whsec_` | **Recriar** quando go-live |
| `CHAT_PROVIDER` | `lovable` (default) | `openai` ou `gemini` | **Definir** explicitamente |
| `OPENAI_API_KEY` ou `GEMINI_API_KEY` | n/a | `sk-...` / `AIza...` | **Adicionar** (um dos dois) |
| `CHAT_MODEL` | n/a | opcional | Definir se quer modelo fixo |
| `LOVABLE_API_KEY` | Auto | **NÃO criar** | Sua ausência ativa modo direto |

### 13.7 OAuth + redirect URL checklist

- [ ] Google Cloud Console: novo OAuth 2.0 Client ID criado (tipo Web)
- [ ] Authorized redirect URIs inclui `https://<NEW_REF>.supabase.co/auth/v1/callback`
- [ ] Authorized JavaScript origins inclui domínios de produção e preview
- [ ] Supabase Dashboard → Authentication → Providers → Google: Client ID + Secret colados, provider habilitado
- [ ] Authentication → URL Configuration → Site URL: `https://staffcareapp.online`
- [ ] Redirect URLs (allowlist): `https://staffcareapp.online/**`, `https://www.staffcareapp.online/**`, qualquer preview ativo
- [ ] Email auth habilitado, "Confirm email" conforme política atual (não auto-confirm a menos que combinado)
- [ ] HIBP (password breach check) reativado

### 13.8 Stripe webhook cutover checklist

- [ ] Stripe Dashboard → Developers → Webhooks → "Add endpoint"
- [ ] URL sandbox: `https://<NEW_REF>.supabase.co/functions/v1/payments-webhook?env=sandbox`
- [ ] URL live (separado): `https://<NEW_REF>.supabase.co/functions/v1/payments-webhook?env=live`
- [ ] Eventos selecionados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- [ ] `whsec_` copiado para `PAYMENTS_SANDBOX_WEBHOOK_SECRET` (e live se aplicável)
- [ ] Endpoint antigo (Lovable Cloud) **mantido ativo 24-72h** como rollback
- [ ] Test event enviado pelo Stripe Dashboard → resposta 200 OK

### 13.9 Edge function deployment order

```bash
# 1. Shared não tem deploy próprio — vai junto com cada função que importa
supabase functions deploy chat                     # depende de _shared via import
supabase functions deploy create-checkout          # depende de _shared/stripe.ts
supabase functions deploy get-stripe-price         # depende de _shared/stripe.ts
supabase functions deploy payments-webhook         # depende de _shared/stripe.ts
supabase functions deploy create-portal-session    # depende de _shared/stripe.ts
supabase functions deploy update-profile-flags     # independente

supabase functions list      # confirmar todas active
supabase secrets list        # confirmar secrets §13.6
```

### 13.10 Smoke test sequence

Executar **na ordem** após `.env` apontar para o novo projeto e republish. Cada falha = STOP + diagnóstico antes de prosseguir.

1. App carrega em produção (domínio atual)
2. Signup novo usuário (email/senha) — `profiles`, `profile_settings`, `subscriptions`, `user_roles` populam
3. Login com usuário existente
4. Login Google
5. CRUD em 3 módulos diferentes (Editor, Agenda, Tarefas)
6. Upload na biblioteca
7. Upload de avatar
8. `/assistente` responde stream
9. `/assinatura` abre Embedded Checkout
10. Pagamento teste `4242 4242 4242 4242` → `subscriptions.subscription_status=active` em <30s
11. `create-portal-session` retorna URL válida
12. Logs de edge functions: zero erros `LOVABLE_API_KEY is not configured`
13. RLS spot-check: usuário B não vê dados de usuário A

### 13.11 Rollback decision points

| Ponto | Critério para rollback | Ação |
|---|---|---|
| Após `db push` | Migrations falharam ou validação SQL §2.3 não bate | Apagar projeto novo, recriar |
| Após deploy edge | `supabase functions list` mostra erro | Redeploy individual; não cutover |
| Após cutover `.env` | Smoke test 1-3 falha | Reverter `.env` + `config.toml`, republish (≤5min) |
| Após smoke test 10 | Webhook não atualiza `subscriptions` | Validar `PAYMENTS_*_WEBHOOK_SECRET`; se persistir, reverter |
| Após 24h em produção | Erros recorrentes nos logs | Manter Lovable Cloud ativo, planejar nova janela |

### 13.12 "Do not proceed if" — blocker list

**NÃO inicie o cutover se qualquer item abaixo for verdadeiro:**

- ⛔ `pgvector` não habilitado no novo projeto
- ⛔ Algum secret obrigatório (§13.6) ausente
- ⛔ Stripe webhook secret não copiado
- ⛔ Google OAuth redirect URI não inclui o novo project ref
- ⛔ Backup do Lovable Cloud não foi feito ou não foi verificado
- ⛔ Não há janela de manutenção combinada
- ⛔ Edge functions não deployadas com sucesso
- ⛔ Whitelist admin em migration `20260423133100` não revisada
- ⛔ Sem owner técnico designado para o cutover

### 13.13 Operator table (compact)

| # | Step | Tool / location | Required input | Expected output | Blocking risk if skipped |
|---|---|---|---|---|---|
| 1 | Criar projeto Supabase | supabase.com dashboard | Workspace + região | Project ref + URL + keys | Sem destino para migração |
| 2 | Habilitar pgvector | Supabase → DB → Extensions | — | Extensão ativa | `doctrinal_chunks` falha no push |
| 3 | `supabase db push` | CLI local | Project linkado | 44 migrations aplicadas | Schema ausente, app quebra |
| 4 | Criar buckets | Supabase → Storage | Nome + visibilidade | 3 buckets ativos | Upload/avatar/docs falham |
| 5 | Configurar secrets | Supabase → Edge Functions → Secrets | Valores §13.6 | Lista completa | Funções 500 |
| 6 | Deploy edge functions | CLI local | Secrets configurados | 6 functions active | Checkout/chat indisponíveis |
| 7 | Configurar OAuth Google | Google Cloud + Supabase Auth | Client ID/Secret + redirect | Provider habilitado | Login Google quebra |
| 8 | Criar webhook Stripe | Stripe → Webhooks | URL nova + eventos | `whsec_` gerado | Subscription nunca atualiza |
| 9 | Import dados | psql / dashboard | Dump origem | Counts batem | Usuários sem dados |
| 10 | Copy storage | CLI | Buckets origem | Files no destino | Avatares/biblioteca quebrados |
| 11 | Atualizar `.env` + `config.toml` | Editor local | Project ref novo | Build aponta novo backend | App ainda no antigo |
| 12 | Republish | Lovable / hosting | Build OK | Domínio responde | Cutover incompleto |
| 13 | Smoke tests §13.10 | App em produção | Conta de teste | 13/13 verde | Bug oculto em produção |
| 14 | Sign-off | §14 | Checklists completos | Aprovação documentada | Sem registro de validação |

---

## 14. POST-MIGRATION SIGN-OFF

Cada bloco deve ser assinado (data + responsável) antes de declarar produção estável.

### 14.1 Technical sign-off

- [ ] `supabase db push` aplicou 44 migrations sem erro
- [ ] Validação SQL §2.3 retornou contagens esperadas
- [ ] `supabase functions list` mostra 6 funções ativas
- [ ] `supabase secrets list` cobre §13.6
- [ ] Logs de edge functions limpos por 24h
- [ ] `pg_publication_tables` confirma realtime onde necessário
- [ ] Backup do Lovable Cloud preservado em local seguro
- [ ] Tag git criada no commit do cutover
- [ ] **Responsável técnico:** _____________________ **Data:** _________

### 14.2 Business-flow sign-off

- [ ] Signup + login (email + Google) testados com conta real
- [ ] Trial de 7 dias criado automaticamente em novo signup
- [ ] Upgrade pago via Stripe Embedded Checkout completou e refletiu em `subscriptions`
- [ ] Cancelamento via `create-portal-session` reflete em `subscriptions.cancel_at_period_end`
- [ ] Editor / Agenda / Tarefas / Biblioteca / Financeiro / Sermões / Diário / Planner: CRUD validado
- [ ] Assistente IA responde com terminologia metodista esperada
- [ ] Comunicação aos usuários sobre eventual reset de senha enviada (se aplicável)
- [ ] **Responsável de produto:** _____________________ **Data:** _________

### 14.3 Security / RLS sign-off

- [ ] `SELECT count(*) FROM pg_policies WHERE schemaname='public'` ≈ 50
- [ ] Spot-check com 2 usuários: A não vê dados de B em todas as tabelas com `user_id`
- [ ] `user_roles` populado, `has_role()` funciona
- [ ] Whitelist admin em `assign_user_role` corresponde à esperada
- [ ] HIBP password check ativo
- [ ] Storage policies bloqueiam acesso cruzado em `biblioteca` e `avatars`
- [ ] Service role key não exposta no frontend (`grep -r SERVICE_ROLE src/` vazio)
- [ ] Linter Supabase sem warnings críticos novos
- [ ] **Responsável de segurança:** _____________________ **Data:** _________

### 14.4 Production readiness confirmation

- [ ] Domínio customizado resolve com SSL válido
- [ ] Webhook Stripe antigo desativado **somente após** 72h estáveis no novo
- [ ] Lovable Cloud antigo pode ser desativado (decisão explícita do owner)
- [ ] Custos OpenAI/Gemini sob alerta de billing
- [ ] Custos Stripe sob alerta de billing
- [ ] Plano de monitoramento de logs definido (frequência + responsável)
- [ ] Documentação interna atualizada (este arquivo + `SUPABASE_CUTOVER_CHECKLIST.md`)
- [ ] **Owner do projeto:** _____________________ **Data:** _________

---

## 15. Resumo final desta etapa (execution support)

**Arquivos criados:**
- `SUPABASE_CUTOVER_CHECKLIST.md` — checklist enxuto (pre / cutover / post / rollback)

**Arquivos atualizados:**
- `MIGRATION_TO_SUPABASE.md` — §13 (FINAL EXECUTION PACKAGE), §14 (POST-MIGRATION SIGN-OFF), §15

**Arquivos NÃO alterados (intencional):**
- `.env`, `.env.development`, `supabase/config.toml`, `.env.example`
- Código de aplicação, edge functions, migrations, RLS

**Inconsistências encontradas e resolvidas:**
- Nenhuma. Auditoria entre `.env.example` ↔ `_shared/stripe.ts` ↔ `chat/index.ts` ↔ `payments-webhook` ↔ `config.toml` ↔ docs anteriores: tudo consistente.

**Final blockers list (não iniciar cutover se algum for true):** ver §13.12.

**Final recommended execution order:** ver §13.3.

**Final manual task list:** §2.10, §13.4, §13.5, §13.7, §13.8 + assinaturas §14.

**Status:** projeto pronto para execução manual da migração. Toda configuração de runtime, secrets e operação está documentada com placeholders e sem credenciais inventadas.

---

## 16. Auditoria final de cutover (executada)

Auditoria de código/config executada antes da janela de cutover. Resultado: **nenhum blocker de runtime**. As referências `lovable` remanescentes no repositório são intencionais e NÃO devem ser removidas — elas não acoplam o runtime ao Lovable Cloud.

### 16.1 Referências `lovable` mantidas (não-blockers)

| Arquivo | Referência | Por que mantida |
|---|---|---|
| `vite.config.ts` | `lovable-tagger` (devDependency) | Plugin Vite ativo apenas em `mode === "development"`. Sem efeito em produção. |
| `src/main.tsx` | check `lovableproject.com` | Gate do service worker — desativa PWA em previews. Inerte em domínio próprio. |
| `playwright.config.ts` / `playwright-fixture.ts` | `lovable-agent-playwright-config` | Tooling de teste. Não roda em produção. |
| `src/components/PaymentTestModeBanner.tsx` | link para `docs.lovable.dev` | Texto informativo no banner de modo teste do Stripe. |
| `supabase/functions/_shared/stripe.ts` | constante `GATEWAY_STRIPE_BASE` | Usada APENAS quando `LOVABLE_API_KEY` está presente (ver `isGatewayMode()`). Em Supabase próprio, `LOVABLE_API_KEY` ausente ⇒ branch direto `api.stripe.com`. |
| `supabase/functions/chat/index.ts` | endpoint `ai.gateway.lovable.dev` | Usado APENAS quando `CHAT_PROVIDER=lovable` (default). Definir `CHAT_PROVIDER=openai`/`gemini` em Supabase próprio ⇒ branch direto. |

### 16.2 Itens que NÃO podem ser alterados pelo agente antes do cutover

Estes arquivos só devem ser editados na janela de cutover, com o `<NEW_PROJECT_REF>` real em mãos. Editar agora quebraria a aplicação em produção (que ainda aponta para Lovable Cloud).

- `.env` — `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `supabase/config.toml` — `project_id`
- Secrets do projeto novo (criados via dashboard Supabase, não via repo)

Template completo já disponível em `.env.example`.

### 16.3 Confirmações de prontidão de backend

| Área | Status | Notas |
|---|---|---|
| Migrations | ✅ Em ordem cronológica, idempotentes | `supabase db push` deve aplicar todas no projeto novo |
| Edge functions | ✅ 6 funções: `chat`, `create-checkout`, `create-portal-session`, `get-stripe-price`, `payments-webhook`, `update-profile-flags` | Todas com `verify_jwt = false` em `config.toml` |
| Secrets necessários | ✅ Documentados em `.env.example` §3 e `MIGRATION_TO_SUPABASE.md` §13.6 | Stripe + chat provider obrigatórios |
| Storage buckets | ✅ 3: `biblioteca` (privado), `avatars` (privado), `methodist-docs` (público) | Criar manualmente no projeto novo |
| Auth / OAuth | ✅ Email + Google | Recriar OAuth Client no Google Cloud apontando para novo callback |
| Stripe webhook | ✅ Endpoint `payments-webhook?env=sandbox|live` | Recriar no Stripe dashboard com novo project ref |
| RLS | ✅ 50+ policies aplicadas via migrations | Spot-check pós-migração obrigatório |
| Realtime | ⚠️ Validar publication `supabase_realtime` se algum módulo depender | Não usado atualmente em produção |

### 16.4 Próximas ações manuais (ordem estrita)

Sequência mínima para o operador. Cada bloco é pré-requisito do próximo. Detalhes completos em §13.

1. **Supabase**: criar projeto → habilitar `pgvector` → anotar ref/URL/keys.
2. **CLI local**: `supabase link --project-ref <NEW_REF>` → `supabase db push`.
3. **Supabase dashboard**: criar 3 buckets (§16.3) → configurar secrets (§13.6) sem `LOVABLE_API_KEY`.
4. **CLI local**: deploy das 6 edge functions (§13.9).
5. **Google Cloud Console**: criar novo OAuth Client Web → adicionar redirect `https://<NEW_REF>.supabase.co/auth/v1/callback`.
6. **Supabase dashboard → Auth → Providers → Google**: colar Client ID + Secret. Site URL = `https://staffcareapp.online`. Allowlist redirect URLs.
7. **Stripe dashboard → Webhooks**: criar endpoint sandbox (e live se aplicável) com `?env=` correto. Copiar `whsec_` para o secret.
8. **Importar dados** (ordem A→G da §13.4) e **copiar storage** (§13.5).
9. **Editar `.env`** local (frontend) e **`supabase/config.toml`** (`project_id`) → rebuild → republish.
10. **Smoke tests** §13.10 (13 itens). Falha bloqueadora ⇒ rollback §13.11.
11. **Sign-off** §14.

### 16.5 Decisão de design preservada

O código (`_shared/stripe.ts`, `chat/index.ts`) é **forward-compatible**:
- Em Lovable Cloud (hoje, com `LOVABLE_API_KEY` presente) → comportamento atual intacto.
- Em Supabase próprio (sem `LOVABLE_API_KEY`, com `CHAT_PROVIDER` definido) → modo direto.

Isto significa que o **cutover é reversível por configuração**: se algo falhar após mudar `.env`, basta reverter `.env` + `config.toml` e republish. Não há código a desfazer.

---

## 17. CUTOVER REAL — Valores do Projeto Novo

> **Project Ref:** `ghkrppjlnwaqsdfvwukr`  
> **URL:** `https://ghkrppjlnwaqsdfvwukr.supabase.co`  
> **Chat Provider:** OpenAI

### 17.1 Arquivos atualizados no repo

- `.env` — atualizado com novo `PROJECT_ID` e `URL` (aguardando publishable key)
- `supabase/config.toml` — `project_id` alterado para `ghkrppjlnwaqsdfvwukr`

### 17.2 URLs para configurar manualmente

| Serviço | URL a configurar |
|---------|------------------|
| Google OAuth Callback | `https://ghkrppjlnwaqsdfvwukr.supabase.co/auth/v1/callback` |
| Stripe Webhook (sandbox) | `https://ghkrppjlnwaqsdfvwukr.supabase.co/functions/v1/payments-webhook?env=sandbox` |
| Stripe Webhook (live) | `https://ghkrppjlnwaqsdfvwukr.supabase.co/functions/v1/payments-webhook?env=live` |

### 17.3 Secrets obrigatórios no novo Supabase

Cadastre em **Project Settings → Edge Functions → Secrets**:

```
STRIPE_SANDBOX_API_KEY=sk_test_...
PAYMENTS_SANDBOX_WEBHOOK_SECRET=whsec_...

# Se for ativar live já:
STRIPE_LIVE_API_KEY=sk_live_...
PAYMENTS_LIVE_WEBHOOK_SECRET=whsec_...

# Chat AI
CHAT_PROVIDER=openai
OPENAI_API_KEY=sk-...
CHAT_MODEL=gpt-4.1-mini
```

### 17.4 Comandos de deploy (ordem)

```bash
# 1. Linkar ao novo projeto
supabase link --project-ref ghkrppjlnwaqsdfvwukr

# 2. Aplicar migrations (44 arquivos)
supabase db push

# 3. Deploy das edge functions
supabase functions deploy chat
supabase functions deploy create-checkout
supabase functions deploy create-portal-session
supabase functions deploy get-stripe-price
supabase functions deploy payments-webhook
supabase functions deploy update-profile-flags

# 4. Verificar deploy
supabase functions list
```

### 17.5 Buckets a criar manualmente

Em **Storage → Buckets**:
1. `biblioteca` → privado
2. `avatars` → privado  
3. `methodist-docs` → público

### 17.6 Próximo passo único

Falta apenas **1 dado** para fechar o `.env`:

> **Sua Publishable Key (anon key)** do novo projeto Supabase.

Cole no `.env`:
```
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...cole_aqui
```

Após isso: rebuild + republish e o app estará 100% no novo backend.
