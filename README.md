# Staffcare — Plataforma Pastoral Metodista

Plataforma de gestão pastoral integrada, desenvolvida sob medida para pastores e pastoras metodistas no Brasil, focando em simplicidade, privacidade (conformidade LGPD) e suporte teológico através de Inteligência Artificial.

## Stack Tecnológica

*   **Framework**: Next.js 14 (App Router)
*   **Linguagem**: TypeScript
*   **Estilização**: Tailwind CSS + shadcn/ui
*   **Banco de Dados & Autenticação**: Supabase (PostgreSQL com RLS ativo)
*   **Integrações**: Stripe / Kiwify (Assinaturas) e IA baseada nos Cânones 2023

## Setup Local

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/staffcare.git
cd staffcare
```

### 2. Instalar Dependências
```bash
bun install # ou npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e preencha as chaves do Supabase:
```bash
cp .env.local.example .env.local
```

### 4. Executar Servidor de Desenvolvimento
```bash
bun dev # ou npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## Deploy na Hostinger

1. Crie uma aplicação Node.js no painel da Hostinger.
2. Conecte o repositório GitHub com auto-deploy na branch `main`.
3. Insira as variáveis de ambiente na dashboard da Hostinger.
4. Rode a build de produção localmente ou pelo pipeline da Hostinger:
```bash
npm run build
npm start
```
