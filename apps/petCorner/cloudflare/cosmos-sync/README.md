# Cloudflare Worker da Cosmos + Chat

Este Worker guarda segredos fora do frontend e disponibiliza:

- `POST /cosmos/sync` para sincronizar produtos da Cosmos.
- `POST /cosmos/product-image` para buscar imagem de um produto por codigo/GTIN.
- `POST /chat/query` para consultas de dados com Gemini + Firestore.
- `POST /products/image/upload` para upload de imagem de produto (multipart).
- `POST /products/image/import-url` para importar imagem remota (ex.: Cosmos) para o R2.
- `GET /products/image/:key` para servir imagens salvas no R2.

Todos os endpoints exigem usuario autenticado no Firebase com claim `admin == true`.

## Configurar

1. Entre na pasta `cloudflare/cosmos-sync`
2. Instale as dependencias com `npm install`
3. Faca login no Cloudflare com `npx wrangler login`
4. Grave os segredos do Worker:
   - `npx wrangler secret put COSMOS_API_TOKEN`
   - `npx wrangler secret put GEMINI_API_KEY`
5. Configure o binding do bucket R2 no `wrangler.jsonc` com o binding `PRODUCT_IMAGES_BUCKET`
6. Ajuste `ALLOWED_ORIGINS` no `wrangler.jsonc` para a URL do app
7. (Opcional) Configure `PRODUCT_IMAGES_PUBLIC_BASE_URL` para servir por um dominio proprio
8. Publique com `npm run deploy`

## Integrar no app

Depois do deploy, copie a URL publicada do Worker e configure no app:

```env
VITE_COSMOS_SYNC_URL=https://petcorner-cosmos-sync.<seu-subdominio>.workers.dev
VITE_CHAT_WORKER_URL=https://petcorner-cosmos-sync.<seu-subdominio>.workers.dev
```

## Payloads de imagem

### Upload de arquivo

- Endpoint: `POST /products/image/upload`
- Headers: `Authorization: Bearer <firebase-id-token>`
- Body: `multipart/form-data` com `file` e opcional `code`
- Resposta:

```json
{
  "imageUrl": "https://.../products/image/products/admin/racao-....jpg",
  "key": "products/admin/racao-....jpg",
  "contentType": "image/jpeg",
  "size": 123456,
  "source": "upload"
}
```

### Importar por URL

- Endpoint: `POST /products/image/import-url`
- Headers: `Authorization: Bearer <firebase-id-token>`
- Body JSON:

```json
{
  "sourceUrl": "https://cdn.exemplo.com/imagem.jpg",
  "code": "PET-001"
}
```

### Buscar imagem na Cosmos por codigo

- Endpoint: `POST /cosmos/product-image`
- Headers: `Authorization: Bearer <firebase-id-token>`
- Body JSON:

```json
{
  "code": "7891910000197"
}
```
