
---

# 🐾 Pet Corner Next

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=yellow)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

Aplicação **full-stack** para gestão de pets, clientes e produtos, construída com **Next.js** e **React (Vite)** em um monorepo.  
Integração com **Firebase** para autenticação (Google & Microsoft) e banco de dados **Firestore**. Deploy automatizado via **Vercel**.  

---

## 📂 Estrutura do Projeto

Este repositório segue o padrão **monorepo** usando [npm workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces):

```

apps/
│── petCorner/   # Frontend em React (Vite) - gerencia dados e autenticação
│── petpage/     # Frontend em Next.js - vitrine institucional + integra SPA do Vite

````

- `petCorner` → builda como SPA e é servido dentro do Next.js (`/app-react`).  
- `petpage` → aplicação principal em Next.js, que roteia e integra os serviços.  

---

## 🚀 Tecnologias

- ⚛️ **React + Vite** → SPA com Firebase  
- ▲ **Next.js 15** → SSR/SSG + API Routes  
- 🔥 **Firebase** → Auth (Google, Microsoft) + Firestore  
- 🗄 **Firestore** → Persistência de clientes, pets e produtos  
- 🎨 **TailwindCSS** (se estiver usando)  
- ☁️ **Vercel** → Deploy automático a cada push  

---

## 🔧 Como rodar localmente

### 1️⃣ Clonar repositório
```bash
git clone https://github.com/Gust4v0Di4sC/Pet-Corner-Next.git
cd Pet-Corner-Next
````

### 2️⃣ Instalar dependências

```bash
npm install
```

### 3️⃣ Configurar variáveis de ambiente

Crie os arquivos `.env.local` dentro de cada app (`apps/petCorner` e `apps/petpage`):

```env
# Firebase
VITE_FIREBASE_API_KEY=xxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxx
VITE_FIREBASE_PROJECT_ID=xxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
VITE_FIREBASE_APP_ID=xxxx
VITE_FIREBASE_MEASUREMENT_ID=xxxx
```

### 4️⃣ Rodar em modo dev

* Para rodar o **Next.js**:

```bash
npm run dev:next
```

* Para rodar o **Vite**:

```bash
npm run dev:vite
```

### 5️⃣ Rodar build completo

```bash
npm run build
```

---

## 📦 Deploy na Vercel

1. Conectar este repositório no [Vercel](https://vercel.com/).
2. Selecionar **Root Directory**: `apps/petpage`.
3. Configurações:

   * Build Command: `npm run build`
   * Install Command: `npm install`
   * Output Directory: `.next`
4. Configurar as **variáveis de ambiente** no painel da Vercel.

---

## 📚 Serviços

* **ClientService** → CRUD de clientes no Firestore
* **DogService** → CRUD de pets
* **ProductService** → CRUD de produtos
* **AuthContext** → Contexto global para autenticação via Firebase

---

## 📸 Prints

Adicione screenshots do app rodando:

* Login com Google/Microsoft

* Lista de clientes/pets/produtos
* Vitrine Next.js

---

## 🛠 Scripts principais

| Comando            | Descrição                        |
| ------------------ | -------------------------------- |
| `npm run dev:next` | Inicia o app Next.js             |
| `npm run dev:vite` | Inicia o app Vite                |
| `npm run build`    | Builda os dois apps em sequência |

---

## ✨ Futuras melhorias

* [ ] Painel administrativo com dashboards
* [ ] Upload de imagens para pets e produtos
* [ ] Notificações em tempo real via Firebase
* [ ] Testes automatizados

---

## 📄 Licença

Este projeto está sob a licença **MIT**.
Sinta-se livre para usar, modificar e compartilhar 🚀.

---

👨‍💻 Desenvolvido por [Gustavo Dias](https://github.com/Gust4v0Di4sC) com ❤️ e ☕

```

---


