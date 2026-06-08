# PROMPTS PRONTOS PARA ANTIGRAVITY

## 📋 Como usar
Copiar cada seção abaixo e colar DIRETAMENTE no Antigravity. Esperar resposta antes de ir para próximo passo.

---

## PROMPT 1️⃣ - AUDITORIA INICIAL

```
Você é um expert em arquitetura Next.js + Supabase. Vou fornecer um projeto React/Vite existente (Staffcare) que preciso recriar em Next.js 14 + Supabase.

PRIMEIRA TAREFA: Fazer auditoria COMPLETA do projeto.

Analise o conteúdo do projeto e responda em forma de relatório estruturado:

1. ESTRUTURA & BUILD
   - Versão Node/npm/bun atual
   - Versão Vite, React, TypeScript
   - Todas dependências principais (lista)
   - Scripts de build/dev/test

2. COMPONENTES REACT (listar todos)
   - Componentes shadcn/ui utilizados (button, card, dialog, etc)
   - Componentes customizados de negócio (Dashboard, Tarefas, etc)
   - Componentes de layout (Sidebar, AppLayout, etc)
   - Componentes de auth (Auth, LoginForm, etc)

3. PÁGINAS/ROTAS (listar todas)
   - Public routes
   - Protected routes
   - Route parameters necessários

4. BANCO DE DADOS SUPABASE
   - Número total de migrations SQL
   - Lista de TODAS tabelas (nome e campo principal)
   - Relacionamentos (foreign keys)
   - Campos especiais (auth.uid(), timestamps, etc)
   - RLS policies existentes (sim/não)

5. LÓGICA CUSTOMIZADA
   - Hooks personalizados (useAuth, useTasks, etc)
   - Context providers
   - Autenticação: como funciona
   - Chamadas HTTP/Supabase: padrão utilizado

6. ASSETS
   - Logos e imagens principais
   - Cores do design (se hardcoded)
   - Ícones customizados
   - Fontes especiais

7. INTEGRAÇÕES EXTERNAS
   - Stripe (pagamento)
   - APIs de terceiros
   - Webhooks
   - Email service

8. ISSUES/GAPS ENCONTRADOS
   - Código legacy ou anti-patterns
   - Dependências desatualizadas
   - Código duplicado
   - Security issues

FORMATO DE RESPOSTA:
Use markdown com headers, listas e tabelas. Seja detalhado. Não sumarize.
```

---

## PROMPT 2️⃣ - CRIAR ESTRUTURA NEXT.JS 14

```
Baseado na auditoria anterior, crie uma estrutura Next.js 14 completa para este projeto.

REQUISITOS:
- App Router (não Pages Router)
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- Supabase Auth + Database

ESTRUTURA DE PASTAS:
Crie scaffolding da pasta /app com:

1. (auth) group
   - login/page.tsx
   - register/page.tsx
   - reset-password/page.tsx
   - layout.tsx (design para auth)

2. (app) group para rotas privadas
   - dashboard/page.tsx
   - layout.tsx (com Sidebar e AppLayout)
   - [outras páginas baseadas no projeto]

3. /app/api/webhooks (se houver Stripe ou similar)

4. /lib
   - supabase/client.ts
   - supabase/server.ts
   - supabase/queries.ts
   - types/index.ts
   - utils.ts

5. /components
   - ui/ (shadcn/ui - Button, Card, Dialog, etc)
   - layout/ (Sidebar, AppLayout, Navigation)
   - auth/ (LoginForm, RegisterForm)
   - modules/ (componentes de negócio)

6. /hooks (custom hooks)

7. /public (assets)

Gere:
- package.json com as dependências necessárias
- tsconfig.json (strict: true)
- next.config.js
- tailwind.config.ts
- .env.local.example
- middleware.ts (para proteger rotas /app)
- .gitignore

RESPOSTA:
Forneça os arquivos acima com código pronto para copiar-colar.
```

---

## PROMPT 3️⃣ - MIGRAR COMPONENTES SHADCN/UI

```
Todos os componentes shadcn/ui do projeto original devem ser adicionados ao novo projeto Next.js.

TAREFA:
Para CADA componente shadcn/ui listado na auditoria (button, card, dialog, tabs, etc):

1. Gerar o código do componente para /components/ui/
2. Remover qualquer dependência de Lovable/Vite
3. Garantir compatibilidade com Next.js App Router
4. Adicionar TypeScript types corretos
5. Manter Tailwind CSS consistente

COMPONENTES A GERAR:
[USE A LISTA DA AUDITORIA]

RESPOSTA:
Crie os arquivos /components/ui/ prontos para usar. Um arquivo por componente.
```

---

## PROMPT 4️⃣ - CONVERTER COMPONENTES DE NEGÓCIO

```
Converta os principais componentes de negócio para Next.js (use lista da auditoria).

PADRÃO:
Para cada componente customizado:

1. Se for uma página:
   - Converter para app/(app)/[rota]/page.tsx
   - Adicionar Server Component quando possível
   - Implementar data fetching com servidor

2. Se for um componente reutilizável:
   - Colocar em /components/modules/
   - Adicionar "use client" se tiver interação
   - Criar tipos TypeScript

3. Remover:
   - Imports Lovable-específicos
   - Refs desnecessários
   - useEffect para side effects (usar Server Components)

4. Adicionar:
   - Tratamento de erros com try/catch
   - Loading states
   - TypeScript strict types

RESPOSTA:
Forneça os componentes convertidos, prontos para usar.
```

---

## PROMPT 5️⃣ - SUPABASE DATABASE SETUP

```
Prepare o schema SQL do Supabase para o novo projeto.

ENTRADA: [COLE AQUI TODAS AS MIGRATIONS SQL]

TAREFAS:
1. Consolidar todas migrations em ORDEM cronológica
2. Validar sintaxe PostgreSQL
3. Garantir que CREATE TABLE statements são válidos
4. Adicionar created_at, updated_at timestamps em todas tabelas
5. Criar arquivo schema.sql único com toda estrutura
6. Listar todas as tabelas e seus campos

RESPOSTA:
1. schema.sql pronto para colar em Supabase SQL Editor
2. Lista de tabelas com descrição
3. Diagrama ER (em markdown)
```

---

## PROMPT 6️⃣ - RLS POLICIES (SEGURANÇA)

```
Implemente Row Level Security (RLS) para TODAS as tabelas Supabase.

PADRÃO DE SEGURANÇA:
- Cada tabela deve ter RLS ativado
- Usuário só vê/edita/deleta seus próprios dados (baseado em user_id ou auth.uid())
- Não pode haver acesso cross-user

PARA CADA TABELA [DO AUDIT]:
Gere 4 políticas:
1. SELECT - usuário vê apenas seus dados
2. INSERT - usuário insere apenas com seu uid
3. UPDATE - usuário edita apenas seus dados
4. DELETE - usuário deleta apenas seus dados

EXEMPLO DE PADRÃO:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_data"
  ON table_name
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

[...adicionar INSERT, UPDATE, DELETE...]
```

RESPOSTA:
SQL pronto para colar em Supabase, uma política por tabela.
```

---

## PROMPT 7️⃣ - AUTENTICAÇÃO & LOGIN

```
Implemente fluxo de autenticação completo com Supabase Auth.

COMPONENTES NECESSÁRIOS:
1. middleware.ts - Proteger rotas /app
2. hooks/useAuth.ts - Hook customizado
3. app/(auth)/login/page.tsx - Página de login
4. app/(auth)/register/page.tsx - Página de registro
5. lib/supabase/client.ts - Cliente Supabase
6. lib/supabase/server.ts - Supabase server-side

REQUIREMENTS:
- Login com email/senha
- Register novo usuário
- Logout
- Password reset (opcional)
- Proteger rotas privadas (redirect para /login)
- RLS validation com RLSValidator.tsx

RESPOSTA:
Crie todos 6 arquivos acima com código pronto para usar.
```

---

## PROMPT 8️⃣ - QUERIES & DATA FETCHING

```
Crie camada de queries Supabase reutilizável.

PADRÃO:
- lib/supabase/queries.ts com funções para cada tabela
- Usar Server Components quando possível
- Implementar caching com React.cache()
- Error handling consistente

EXEMPLO:
```typescript
export async function getTasks(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}
```

TAREFAS:
Para CADA tabela da auditoria, gere:
1. getAll[Table]s(filters?) - Buscar múltiplos
2. get[Table](id) - Buscar um
3. create[Table](data) - Criar
4. update[Table](id, data) - Atualizar
5. delete[Table](id) - Deletar

RESPOSTA:
queries.ts completo com todas funções.
```

---

## PROMPT 9️⃣ - ENVIRONMENT VARIABLES

```
Crie configuração correta de variáveis de ambiente.

ARQUIVO: .env.local.example

VARIÁVEIS NECESSÁRIAS:
1. Supabase
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   
2. App
   - NEXT_PUBLIC_APP_URL
   - NODE_ENV
   
3. Opcionais (se houver)
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - EMAIL_SERVICE_KEY

ARQUIVO TAMBÉM: middleware para validar env vars

RESPOSTA:
.env.local.example com comentários explicando cada variável.
```

---

## PROMPT 🔟 - GITHUB SETUP

```
Configure repositório GitHub para deploy automático.

CRIAR:
1. README.md
   - Descrição do projeto
   - Stack utilizado
   - Setup local (npm install, npm run dev)
   - Variáveis de ambiente
   - Deploy instructions

2. .gitignore
   - node_modules/
   - .env.local
   - .next/
   - dist/

3. CONTRIBUTING.md (opcional)

4. LICENSE

RESPOSTA:
Gere os 4 arquivos acima.
```

---

## PROMPT 1️⃣1️⃣ - BUILD & DEPLOY HOSTINGER

```
Prepare projeto para deploy na Hostinger (Node.js).

TAREFAS:
1. Validar que package.json tem scripts:
   - npm run dev
   - npm run build
   - npm start

2. Criar arquivo de configuração para Hostinger
   - Build: npm run build
   - Start: npm start
   - Node version: 18+

3. Documentar env vars necessárias na Hostinger dashboard

4. Testar build localmente:
   ```bash
   npm run build
   npm start
   # Acessar http://localhost:3000
   ```

RESPOSTA:
Checklist pronto e documentação de como fazer deploy.
```

---

## PROMPT 1️⃣2️⃣ - TESTES & VALIDAÇÃO FINAL

```
Valide toda a aplicação antes de ir para produção.

CHECKLIST TÉCNICO:
- [ ] TypeScript sem erros (npm run build sem warnings)
- [ ] Componentes renderizam sem erro
- [ ] Login/Logout funciona
- [ ] CRUD (create, read, update, delete) funciona
- [ ] RLS policies protegem dados
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Performance: npm run build < 5s, bundle < 500kb
- [ ] Sem console.errors

CHECKLIST FUNCIONAL:
[Use os flows do projeto original]

CHECKLIST SEGURANÇA:
- [ ] Sem API keys/secrets no código
- [ ] RLS ativado em todas tabelas
- [ ] Auth obrigatório em rotas /app
- [ ] Environment vars não commitadas

RESPOSTA:
Script de teste completo (ou checklist) para validar tudo.
```

---

## 📝 ORDEM DE EXECUÇÃO

Use os prompts NESTA ordem:

1. ✅ PROMPT 1️⃣ - Auditoria
2. ✅ PROMPT 2️⃣ - Estrutura Next.js
3. ✅ PROMPT 3️⃣ - Componentes shadcn/ui
4. ✅ PROMPT 4️⃣ - Componentes de negócio
5. ✅ PROMPT 5️⃣ - Database schema
6. ✅ PROMPT 6️⃣ - RLS Policies
7. ✅ PROMPT 7️⃣ - Auth
8. ✅ PROMPT 8️⃣ - Queries
9. ✅ PROMPT 9️⃣ - Environment
10. ✅ PROMPT 🔟 - GitHub
11. ✅ PROMPT 1️⃣1️⃣ - Build/Deploy
12. ✅ PROMPT 1️⃣2️⃣ - Testes

---

## 💡 DICAS DE USO

1. **Forneça contexto completo** - Cole o conteúdo do arquivo/pasta quando pedir análise
2. **Uma coisa por vez** - Use um prompt de cada vez, espere resposta completa
3. **Iterativo** - Se não ficou bom, peça ajustes específicos
4. **Teste localmente** - Antes de cada push para GitHub

---

**Boa execução! 🚀**
