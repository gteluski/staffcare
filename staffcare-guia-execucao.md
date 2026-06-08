# STAFFCARE - Guia de Execução Antigravity

## ⚡ EXECUÇÃO RÁPIDA (Use isto no Antigravity)

### PASSO 1: Análise do Projeto
```
1. Extrair e abrir staffcare.zip na pasta de trabalho
2. Ler package.json → identificar dependências
3. Ler vite.config.ts → entender build atual
4. Listar todos components no src/components/
5. Listar todos pages/screens no src/
6. Contar migrations SQL em /migrations
7. Mapear estrutura de types em types.ts
```

**Entrega esperada:**
- Documento "STAFFCARE_AUDIT.md" com inventário completo
- Lista de 20+ componentes React
- Lista de 15+ tabelas Supabase
- Identificação de dependências core (auth, forms, validation)

---

### PASSO 2: Criar Estrutura Next.js 14
```bash
# Criar novo projeto (ou usar template)
npm create next-app@latest staffcare --typescript --tailwind --no-eslint --app

# Instalar dependências
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @hookform/resolvers react-hook-form zod
npm install @tanstack/react-query
npm install sonner # toasts
npm install date-fns
npm install bcryptjs
```

**Estrutura criada:**
- app/ (com layout.tsx, page.tsx)
- lib/supabase/ (client.ts, server.ts, queries.ts)
- components/ui/ (shadcn/ui)
- hooks/
- .env.local.example

---

### PASSO 3: Copiar/Adaptar Componentes
```
Para CADA componente Lovable:
  1. Copiar arquivo .tsx
  2. Converter imports:
     - "from '../../components'" → "from '@/components'"
     - React.FC<Props> → function Component(props: Props)
  3. Adicionar "use client" no topo se tiver hooks/interação
  4. Validar que não usa imports de Lovable específicos
  5. Testar compilação TypeScript
  6. Adicionar ao pasta apropriada (/components/ui, /components/modules, etc)
```

**Para Dialogs/Modals:**
- Converter para Dialog shadcn/ui
- Usar state local (useState) ou Context
- Remover refs desnecessários

**Para Forms:**
- Usar react-hook-form + zod
- Implementar validação client-side
- Adicionar error handling com try/catch

---

### PASSO 4: Supabase - Database & Auth

#### 4.1 Schema SQL
```
Criar em Supabase > SQL Editor:
  1. Copiar cada migration .sql
  2. Colar em ordem cronológica
  3. Executar e verificar sucesso
  4. Testar que tabelas foram criadas
```

#### 4.2 RLS Policies - CRÍTICO
```sql
-- Exemplo para tabela 'tasks' (multi-tenant por user_id)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário só vê seus dados
CREATE POLICY "users_select_own_tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- INSERT: usuário só insere com seu uid
CREATE POLICY "users_insert_own_tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- UPDATE: usuário só edita seus dados
CREATE POLICY "users_update_own_tasks"
  ON tasks
  FOR UPDATE
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- DELETE: usuário só deleta seus dados
CREATE POLICY "users_delete_own_tasks"
  ON tasks
  FOR DELETE
  USING (auth.uid()::uuid = user_id);
```

**Aplicar para CADA tabela que tem user_id, organization_id, ou similar.**

#### 4.3 Testar RLS
```typescript
// lib/supabase/test-rls.ts
export async function testRLS() {
  const supabase = createClient();
  
  // Try SELECT without auth → deve falhar
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
  
  console.log('RLS working:', !!error);
}
```

---

### PASSO 5: Auth Setup

#### 5.1 Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll() } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/app/:path*', '/login'],
};
```

#### 5.2 Auth Context Hook
```typescript
// hooks/useAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return { user, loading, supabase };
}
```

#### 5.3 Login Page
```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/app/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Staffcare Login</h1>
        
        {error && <div className="bg-red-100 text-red-800 p-3 rounded">{error}</div>}
        
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
```

---

### PASSO 6: Queries & Data Fetching

#### 6.1 Queries Pattern
```typescript
// lib/supabase/queries.ts
import { createClient } from './server';

export async function getTasks(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(task: Omit<Task, 'id' | 'created_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### 6.2 Em Pages/Components
```typescript
// app/(app)/tarefas/page.tsx
import { getTasks } from '@/lib/supabase/queries';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function TasksPage() {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return <div>Unauthorized</div>;

  const tasks = await getTasks(user.id);

  return (
    <div>
      <h1>Minhas Tarefas</h1>
      {/* Renderizar tasks */}
    </div>
  );
}
```

---

### PASSO 7: Variáveis de Ambiente

#### .env.local.example
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Na Hostinger, adicionar via Dashboard:**
- Environment Variables na config do app
- Valores sem quotes
- Reload automático

---

### PASSO 8: GitHub

```bash
# Inicializar git
git init
git add .
git commit -m "Initial commit: Next.js 14 + Supabase"

# Criar repo no GitHub (via web)
# https://github.com/new

# Push
git remote add origin https://github.com/seu-usuario/staffcare.git
git branch -M main
git push -u origin main
```

**Criar .gitignore:**
```
.env.local
.env.*.local
node_modules/
.next/
dist/
```

**Criar README.md:**
```markdown
# Staffcare

Plataforma integrada de gestão para igrejas metodistas.

## Stack
- Next.js 14
- Supabase
- Tailwind CSS
- shadcn/ui

## Setup Local

```bash
git clone https://github.com/seu-usuario/staffcare.git
cd staffcare

npm install
cp .env.local.example .env.local
# Adicionar variáveis de ambiente

npm run dev
```

Acessar: http://localhost:3000

## Deploy

Hostinger Node.js hosting com auto-deploy via GitHub.
```
```

---

### PASSO 9: Deploy Hostinger

**Em Hostinger > Node.js Application:**

1. **GitHub Integration**
   - Conectar repositório
   - Branch: main
   - Deploy automático: ✅

2. **Build Settings**
   - Build command: `npm run build`
   - Start command: `npm start`
   - Node version: 18 ou superior

3. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
   NODE_ENV = production
   ```

4. **Domain**
   - Apontar domínio customizado
   - SSL/HTTPS automático

5. **First Deploy**
   ```bash
   git push origin main
   # Aguardar build na Hostinger (5-10 min)
   # Verificar https://seu-dominio.com.br
   ```

---

### PASSO 10: Testes Pós-Deploy

**Checklist:**
- [ ] Homepage carrega
- [ ] Login funciona
- [ ] Dashboard abre após login
- [ ] CRUD (create, read, update, delete) funciona
- [ ] Busca/filtros funcionam
- [ ] Mobile responsivo
- [ ] Sem erros no console
- [ ] Lighthouse score > 80

---

## 📊 ENTREGÁVEIS POR PASSO

| Passo | Entregável | Status |
|-------|-----------|--------|
| 1 | STAFFCARE_AUDIT.md | ⏳ |
| 2 | Next.js estrutura pronta | ⏳ |
| 3 | Componentes migrados | ⏳ |
| 4 | Banco dados + RLS | ⏳ |
| 5 | Auth (login/logout) | ⏳ |
| 6 | Queries & data flow | ⏳ |
| 7 | Env setup completo | ⏳ |
| 8 | GitHub repo | ⏳ |
| 9 | Deploy Hostinger | ⏳ |
| 10 | Testes & validação | ⏳ |

---

## 🎯 TIMING

- **Auditoria**: 30 min
- **Next.js setup**: 20 min
- **Componentes**: 2-3h (depende volume)
- **Database**: 1h
- **Auth**: 1h
- **Queries**: 1h
- **Deploy**: 30 min
- **Testes**: 30 min

**Total: 6-8h para projeto completo**

---

## 💡 DICAS

1. **Testar RLS antes de colocar em produção**
   - Sem RLS, qualquer user vê dados de todos

2. **Usar Server Components onde possível**
   - Melhor performance, menos JS no browser

3. **Types sempre em sync com DB**
   - Usar `Database.Tables['table_name']['Row']` do Supabase

4. **Backups automáticos**
   - Supabase → Settings → Backups (ativar)

5. **Rate limiting nas APIs**
   - Se tiver Stripe ou APIs públicas

6. **Monitorar Logs**
   - Hostinger → Logs
   - Supabase → Logs (query performance)

---

**Boa sorte! 🚀**
