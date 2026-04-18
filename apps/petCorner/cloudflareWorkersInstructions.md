# Cloudflare Workers Instructions

Este guia resume como publicar e manter a integracao da Cosmos usando Cloudflare Workers Free.

## O que cada autenticacao faz

- `COSMOS_API_TOKEN`: segredo da API da Cosmos. Fica salvo no Cloudflare Worker como secret. Nunca vai para o frontend.
- `Firebase ID token`: token do usuario logado no app. O frontend envia esse token para o Worker ao clicar em `Sincronizar via Cosmos`.
- `Cloudflare login`: autenticacao da sua conta Cloudflare para publicar e gerenciar o Worker com o Wrangler.

## Como o fluxo funciona

1. O admin faz login no app.
2. O app pega o `idToken` do Firebase.
3. O frontend chama o Worker com `Authorization: Bearer <idToken>`.
4. O Worker valida o token do Firebase usando as chaves publicas do Google.
5. Se o usuario tiver claim `admin == true`, o Worker consulta a Cosmos com o segredo salvo no Cloudflare.
6. O Worker devolve os itens ao frontend.
7. O frontend grava os itens no Firestore `productCatalog`.

## O que precisa existir no Worker

- Secret: `COSMOS_API_TOKEN`
- Variavel: `FIREBASE_PROJECT_ID=petcorner-219fc`
- Variavel: `ALLOWED_ORIGINS=<urls permitidas do app>`

Essas configuracoes ficam em:

- [cloudflare/cosmos-sync/wrangler.jsonc](./cloudflare/cosmos-sync/wrangler.jsonc)
- [cloudflare/cosmos-sync/src/index.js](./cloudflare/cosmos-sync/src/index.js)

## Passo a passo na plataforma Cloudflare

1. Criar ou acessar sua conta Cloudflare.
2. Abrir `Workers & Pages`.
3. No terminal, entrar na pasta do Worker:

```bash
cd "D:\meus projetos\PertCornerNext\apps\petCorner\cloudflare\cosmos-sync"
```

4. Instalar dependencias:

```bash
npm install
```

5. Fazer login no Cloudflare:

```bash
npx wrangler login
```

6. Gravar o segredo da Cosmos:

```bash
npx wrangler secret put COSMOS_API_TOKEN
```

7. Ajustar `ALLOWED_ORIGINS` em `wrangler.jsonc`.
8. Publicar o Worker:

```bash
npm run deploy
```

9. Copiar a URL final publicada em `*.workers.dev`.
10. Colocar essa URL no app, no arquivo [\.env](./.env):

```env
VITE_COSMOS_SYNC_URL=https://petcorner-cosmos-sync.<seu-subdominio>.workers.dev
```

11. Reiniciar o app depois de atualizar o `.env`.

## Como preencher ALLOWED_ORIGINS

### Apenas ambiente local

```json
"ALLOWED_ORIGINS": "http://localhost:5173"
```

### Local e producao

```json
"ALLOWED_ORIGINS": "http://localhost:5173,https://seu-dominio.com"
```

## Onde conferir no painel da Cloudflare

No painel:

1. `Workers & Pages`
2. Abrir o Worker `petcorner-cosmos-sync`
3. Ir em `Settings`
4. Abrir `Variables and Secrets`

Voce deve ver:

- Secret `COSMOS_API_TOKEN`
- Variavel `FIREBASE_PROJECT_ID`
- Variavel `ALLOWED_ORIGINS`

## O que nao fazer

- Nao colocar o token da Cosmos no frontend.
- Nao preencher `VITE_COSMOS_TOKEN`.
- Nao guardar o token da Cosmos em `wrangler.jsonc`.
- Nao commitar `.dev.vars` nem credenciais locais.

## Comandos principais

```bash
cd "D:\meus projetos\PertCornerNext\apps\petCorner\cloudflare\cosmos-sync"
npm install
npx wrangler login
npx wrangler secret put COSMOS_API_TOKEN
npm run deploy
```

## Arquivos do projeto relacionados

- [cloudflare/cosmos-sync/src/index.js](./cloudflare/cosmos-sync/src/index.js)
- [cloudflare/cosmos-sync/wrangler.jsonc](./cloudflare/cosmos-sync/wrangler.jsonc)
- [src/services/cosmosCatalogService.ts](./src/services/cosmosCatalogService.ts)
- [src/hooks/product/useProductCatalog.ts](./src/hooks/product/useProductCatalog.ts)
- [scripts/write-runtime-config.mjs](./scripts/write-runtime-config.mjs)
- [src/config/runtimeConfig.ts](./src/config/runtimeConfig.ts)
- [\.env](./.env)
