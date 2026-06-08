# Guia de Deploy — Hostinger (Node.js)

Este documento detalha as configurações e etapas necessárias para colocar a aplicação Next.js 14 em produção na Hostinger através do gerenciamento de aplicações Node.js.

## 1. Configuração da Aplicação Node.js na Hostinger

No painel hPanel da Hostinger, navegue até **Sites > Adicionar Site / Gerenciar Site** e configure:

*   **Versão do Node.js**: Escolha `18.x` ou `20.x` (mínimo exigido: v18.17+ para Next.js 14).
*   **Application Startup File**: `server.js` (ou use o comando `npm run start` caso utilize o painel com suporte a scripts customizados).
*   **Diretório da Aplicação**: Aponte para a pasta raiz onde o repositório foi clonado.

### Configuração do script de inicialização (`server.js`)
Para servidores VPS ou hospedagem que necessitam de um arquivo executável direto (`server.js`) em vez de rodar o comando `npm start`, crie um arquivo `server.js` na raiz com o seguinte código:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const port = process.env.PORT || 3000

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
```

## 2. Variáveis de Ambiente no Painel Hostinger

Insira as seguintes chaves de ambiente no menu de variáveis de ambiente do seu aplicativo Node.js:

| Chave | Valor Esperado |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave Anon pública do Supabase |
| `NEXT_PUBLIC_APP_URL` | URL de produção (Ex: `https://seu-dominio.com.br`) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (ou a porta padrão do seu host) |

## 3. Fluxo de Integração Contínua (GitHub)

1. Vá para a seção de deploy do seu painel e ative a **Integração com o GitHub**.
2. Conecte sua conta do GitHub e selecione o repositório `staffcare`.
3. Escolha a branch `main`.
4. Marque a opção de **Auto-deploy** para disparar o rebuild a cada `git push`.
