# Cloudflare Worker da Cosmos

Este Worker guarda o token da Cosmos fora do frontend e libera a sincronizacao apenas para usuarios autenticados no Firebase com claim `admin == true`.

## Configurar

1. Entre na pasta `cloudflare/cosmos-sync`
2. Instale as dependencias com `npm install`
3. Faca login no Cloudflare com `npx wrangler login`
4. Grave o segredo da Cosmos com `npx wrangler secret put COSMOS_API_TOKEN`
5. Ajuste `ALLOWED_ORIGINS` no `wrangler.jsonc` para a URL do app
6. Publique com `npm run deploy`

## Integrar no app

Depois do deploy, copie a URL publicada do Worker e configure no app:

```env
VITE_COSMOS_SYNC_URL=https://petcorner-cosmos-sync.<seu-subdominio>.workers.dev
```
