# STAFFCARE - Antigravity Audit & Migration Prompt

## OBJETIVO
Fazer auditoria completa do projeto Staffcare (React/Vite de Lovable) e recriar em **Next.js 14 + Supabase + Tailwind + shadcn/ui** seguindo exatamente o padrão dos outros apps (PrecifiQ, CRM Psico).

---

## 🔍 FASE 1: AUDITORIA COMPLETA

### 1.1 Estrutura & Configuração
- [ ] Verificar `package.json`: dependências, scripts, versões
- [ ] Validar `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- [ ] Listar todos os componentes shadcn/ui utilizados
- [ ] Mapear estrutura de pastas (src/, lib/, components/, hooks/, utils/)
- [ ] Identificar variáveis de ambiente necessárias (.env.example)
- [ ] Verificar setup de autenticação (Supabase Auth)

### 1.2 Componentes & Páginas
- [ ] Listar todas as páginas/rotas (App.tsx como entry point)
- [ ] Identificar componentes de negócio (Dashboard, Tarefas, Agenda, Biblioteca, etc)
- [ ] Verificar componentes de auth (Auth.tsx, ResetPassword, etc)
- [ ] Mapear dialogs, forms, views (Kanban, List, Calendar, etc)
- [ ] Inventariar componentes compartilhados (Sidebar, Layout, etc)

### 1.3 Banco de Dados
- [ ] Contar migrations SQL (em /migrations ou timestamps)
- [ ] Listar todas as tabelas criadas
- [ ] Mapear relacionamentos entre tabelas
- [ ] Verificar políticas RLS (Row Level Security)
- [ ] Identificar índices e constraints
- [ ] Checar triggers e funções PostgreSQL

### 1.4 Lógica de Negócio
- [ ] Mapear todos os hooks customizados (useAuth, useTasks, etc)
- [ ] Listar chamadas à API (Supabase client)
- [ ] Verificar autenticação e autorização
- [ ] Identificar fluxos de pagamento (Stripe)
- [ ] Mapear integrações externas (API calls)
- [ ] Verificar validações e regras de negócio

### 1.5 Assets & Mídia
- [ ] Listar imagens, ícones, logos
- [ ] Verificar manifest.json, favicon, PWA assets
- [ ] Mapear paleta de cores e design tokens
- [ ] Inventariar fontes customizadas

---

## 🏗️ FASE 2: TRANSFORMAÇÃO PARA NEXT.JS 14

### 2.1 Estrutura de Pastas
```
staffcare/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── tarefas/
│   │   ├── agenda/
│   │   ├── biblioteca/
│   │   ├── financeiro/
│   │   └── perfil/
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── queries.ts
│   ├── utils/
│   └── types/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── auth/
│   └── modules/
├── hooks/
├── public/
└── .env.local.example
```

### 2.2 Rotas & Pages
- Converter App.tsx em app/layout.tsx + page.tsx
- Criar route segments para cada seção (auth, app, etc)
- Mapear rotas do React Router para Next.js App Router
- Implementar loading.tsx e error.tsx onde apropriado
- Adicionar metadata e SEO

### 2.3 Autenticação
- Mover Auth.tsx para (auth)/login/page.tsx
- Implementar middleware.ts para proteger rotas privadas
- Setup Supabase Auth com Next.js (getSession server-side)
- Criar auth context/hook customizado
- Implementar password reset, confirm email flow

### 2.4 Componentes & UI
- Manter todos componentes shadcn/ui (compatível com Next.js)
- Converter class components para functional/hooks
- Adicionar "use client" em componentes interativos
- Mover Sidebar para componente reusável
- Criar AppLayout para páginas autenticadas
- Implementar Navigation proper do Next.js

### 2.5 Hooks & State Management
- Converter hooks para React Server Components onde possível
- Manter hooks do lado cliente em componentes marcados com "use client"
- Implementar React Query (tanstack/react-query) se houver muitas chamadas
- Criar custom hooks reutilizáveis (useAuth, useTasks, etc)

---

## 🗄️ FASE 3: SUPABASE - DATABASE & AUTH

### 3.1 Migrations
- Consolidar todas as migrations SQL em ordem cronológica
- Criar arquivo schema.sql único com toda estrutura
- Validar sintaxe PostgreSQL
- Verificar CREATE TABLE statements
- Garantir tipos de dados corretos
- Adicionar created_at, updated_at timestamps

### 3.2 RLS Policies
**CRÍTICO**: Implementar Row Level Security para cada tabela:
```sql
-- Exemplo padrão para tabelas multi-tenant
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
- Revisar cada política existente
- Garantir auth.uid() está correto
- Testar com RLSValidator.tsx

### 3.3 Funções & Triggers
- Mapear todas as functions PostgreSQL
- Converter triggers para idempotentes
- Documentar lógica de cada function
- Testar calls via client.rpc()

### 3.4 Índices & Performance
- Adicionar índices em colunas frequentemente consultadas
- Índices em foreign keys
- Índices em colunas de filtro/busca
- Documentar estratégia de cache

---

## 🔐 FASE 4: VARIÁVEIS DE AMBIENTE

### Arquivo: `.env.local.example`
```
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# STRIPE (se houver pagamento)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# APP
NEXT_PUBLIC_APP_URL=https://staffcare.seu-dominio.com.br
NODE_ENV=production
```

### Checklist
- [ ] Remover hardcoded URLs/keys
- [ ] Usar process.env.NEXT_PUBLIC_* para cliente
- [ ] Usar process.env.* apenas no servidor
- [ ] Documentar cada variável
- [ ] Criar .env.local (gitignored) com valores reais

---

## 🎨 FASE 5: DESIGN SYSTEM & BRANDING

### Cores Voxion (já em uso)
- Primary: `#31251f` (marrom escuro)
- Secondary: `#f18535` (laranja)
- Accent: `#d8c5b6` (bege)

### Validar Tailwind Config
```js
// tailwind.config.ts
extend: {
  colors: {
    voxion: {
      primary: '#31251f',
      secondary: '#f18535',
      accent: '#d8c5b6',
    }
  }
}
```

### Tipografia
- Fonte padrão para corpo: inter/system
- Fonte títulos: bold weights
- Manter consistência de sizes

### Components shadcn/ui a manter
- Button, Card, Dialog, Form
- Tabs, Table, Sidebar
- Select, Input, Textarea
- Toast/Toaster
- **Tudo que está no projeto**

---

## ☁️ FASE 6: DEPLOY & GITHUB

### GitHub Setup
- [ ] Criar repositório: `github.com/seu-usuario/staffcare`
- [ ] Estrutura: README.md, .gitignore, LICENSE
- [ ] Branch main -> produção
- [ ] Branch develop -> staging

### .gitignore
```
.env.local
.env.*.local
node_modules/
.next/
dist/
```

### README.md
- Descrição do projeto
- Stack: Next.js 14, Supabase, Tailwind, shadcn/ui
- Setup local (npm install, npm run dev)
- Deploy instructions (Hostinger)
- Variáveis de ambiente necessárias
- Licença

### Hostinger Setup (Tradicional/Node.js)
- [ ] Criar projeto Node.js na Hostinger
- [ ] Conectar repositório GitHub
- [ ] Environment variables na dashboard
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Domínio customizado
- [ ] SSL/HTTPS automático

---

## 🧪 FASE 7: TESTES & VALIDAÇÃO

### Checklist Funcional
- [ ] Login/Logout funciona
- [ ] Criar/editar/deletar dados (CRUD)
- [ ] Filtros e busca funcionam
- [ ] Paginação correcta
- [ ] Upload de arquivos (se houver)
- [ ] Webhooks Stripe (se houver)
- [ ] Email confirmação (se houver)

### Checklist Técnico
- [ ] TypeScript sem erros
- [ ] Sem console.errors ou warnings
- [ ] Sem imports não utilizados
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Performance: Lighthouse > 80
- [ ] Acessibilidade: WCAG AA
- [ ] SEO básico (meta tags)

### Checklist Segurança
- [ ] RLS policies ativadas em todas tabelas
- [ ] Sem credenciais no código
- [ ] Rate limiting em APIs (se houver)
- [ ] CORS configurado
- [ ] Headers de segurança (CSP, X-Frame-Options)
- [ ] SQL injection prevention (usar Supabase client)

---

## 📋 CHECKLIST FINAL

- [ ] Projeto Next.js 14 funcionando localmente
- [ ] Todas migrations SQL aplicadas em Supabase
- [ ] RLS policies configuradas e testadas
- [ ] Variables de ambiente corretas
- [ ] GitHub repo criado e sincronizado
- [ ] Build production testado localmente (`npm run build`)
- [ ] Deploy na Hostinger configurado com auto-deploy
- [ ] Domínio apontando para o app
- [ ] SSL/HTTPS funcionando
- [ ] Backups automáticos do Supabase configurados
- [ ] Documentação completa (README, env.example)

---

## 📞 PADRÃO DE RESPOSTA

Ao terminar cada fase, responda com:
1. **Status**: ✅ Concluído / ⚠️ Ajustes necessários
2. **Achados**: Lista de problemas/gaps encontrados
3. **Ações**: O que vai ser feito para resolver
4. **Próximo passo**: O que vem depois

Mantenha tom profissional, executivo, foco em performance e segurança.

---

## 🚀 INÍCIO

**Comece pela FASE 1 - Auditoria Completa.**

Analise todo conteúdo do projeto Staffcare fornecido, crie um relatório detalhado dos achados, e propostas claras para cada item listado acima.
