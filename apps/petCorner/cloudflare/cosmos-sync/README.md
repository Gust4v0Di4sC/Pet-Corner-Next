# Cloudflare Worker da Cosmos + Chat

Este Worker guarda segredos fora do frontend e disponibiliza:

- `POST /cosmos/sync` para sincronizar produtos da Cosmos.
- `POST /chat/query` para consultas de dados com Gemini + Firestore.

Todos os endpoints exigem usuario autenticado no Firebase com claim `admin == true`.

## Configurar

1. Entre na pasta `cloudflare/cosmos-sync`
2. Instale as dependencias com `npm install`
3. Faca login no Cloudflare com `npx wrangler login`
4. Grave os segredos do Worker:
   - `npx wrangler secret put COSMOS_API_TOKEN`
   - `npx wrangler secret put GEMINI_API_KEY`
5. Ajuste `ALLOWED_ORIGINS` no `wrangler.jsonc` para a URL do app
6. Publique com `npm run deploy`

## Integrar no app

Depois do deploy, copie a URL publicada do Worker e configure no app:

```env
VITE_COSMOS_SYNC_URL=https://petcorner-cosmos-sync.<seu-subdominio>.workers.dev
VITE_CHAT_WORKER_URL=https://petcorner-cosmos-sync.<seu-subdominio>.workers.dev
```
