# CautelasB4 — Controle de Materiais e Cautelas

Site para controle de estoque de materiais e cautelas (empréstimo de material para instrução), com:

- Estoque ao vivo, organizado por categoria, com foto, quantidade e status de cada item (**Disponível**, **Cautelado**, **F.A**).
- Criação de cautelas (retirar item) e devolução, direto pelo site.
- Ajuste manual de status (ex: marcar item como F.A por dano/manutenção).
- Cadastro, edição e remoção de itens e categorias.
- Login por usuário e senha (cada militar tem sua própria conta); não há cadastro público — só administradores criam contas pelo site.
- Painel de administração para categorias, estoques e usuários (criar conta, editar dados, redefinir senha, promover/remover admin).
- Atualização em tempo real entre todos que estiverem com o site aberto (via WebSocket).

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript + Prisma ORM + Socket.IO
- **Banco de dados:** PostgreSQL

## Rodando localmente

1. Suba um banco Postgres (local, [Neon](https://neon.tech) ou [Supabase](https://supabase.com) têm plano gratuito).
2. Configure o backend:

   ```bash
   cd server
   cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET
   npm install
   npx prisma migrate deploy
   npm run dev             # http://localhost:4000
   ```

3. Em outro terminal, configure o frontend:

   ```bash
   cd client
   npm install
   npm run dev              # http://localhost:5173 (proxy para a API em :4000)
   ```

4. Acesse `http://localhost:5173` e entre com a conta de administrador já criada pela migration:

   | Usuário | Senha |
   |---|---|
   | `scolari` | `scolarib4` |

   **Troque essa senha assim que possível** (Usuários → Redefinir senha) e use essa conta para criar as demais pelo painel **Usuários** — não existe cadastro público no site.

## Deploy (nuvem)

O backend serve tanto a API (`/api/*`) quanto o build do frontend, então dá para publicar em um único serviço. O comando `npm start` já roda as migrations (`prisma migrate deploy`) antes de subir o servidor — não precisa de nenhum passo manual de banco após o primeiro deploy.

1. **Banco de dados — crie um Postgres gratuito no [Neon](https://neon.tech)** (recomendado: o free tier do Neon não expira, diferente do Postgres gratuito do Render/Railway). Copie a *connection string* (Dashboard → Connect).
2. **Serviço web — use o Blueprint pronto deste repositório:**
   - No [Render](https://render.com), clique em **New +** → **Blueprint**.
   - Conecte a conta do GitHub e selecione o repositório `Scolari666/CautelasB4` (branch com o código mais recente).
   - Render vai ler o `render.yaml` da raiz do projeto e pedir o valor de `DATABASE_URL` — cole a connection string do Neon. O `JWT_SECRET` é gerado automaticamente.
   - Clique em **Apply** e aguarde o build (alguns minutos).
3. Acesse a URL pública gerada pelo Render (ex: `https://cautelasb4.onrender.com`) e entre com `scolari` / `scolarib4` — **troque essa senha assim que possível** em Usuários → Redefinir senha.

> Sem Blueprint: dá pra criar o serviço manualmente (New + → Web Service, mesmas configs: build `npm install && npm run build`, start `npm start`, env vars `DATABASE_URL` e `JWT_SECRET`). O `render.yaml` só automatiza esse passo.
>
> O plano gratuito do Render "dorme" após ~15 min sem acesso (o primeiro acesso depois disso demora uns 30-50s para acordar) — normal para uso interno; dá pra migrar para um plano pago depois se precisar de resposta imediata.

## Estrutura do projeto

```
server/   API Express + Prisma (PostgreSQL) + Socket.IO
client/   Frontend React + Vite + Tailwind
```

## Modelo de dados (resumo)

- **User**: nome, usuário (login), senha (hash), e-mail opcional, matrícula e graduação opcionais, papel (`ADMIN`/`USER`).
- **Estoque**: depósitos/unidades (ex: SMA POA, SMA Cachoeirinha) — cada item pertence a um estoque, com quantidades independentes.
- **Category**: categorias de material (ex: Armamento, Fardamento, Comunicações).
- **Item**: nome, foto, descrição, categoria, quantidade total e sua divisão em disponível / cautelado / F.A.
- **Cautela**: registro de retirada de um item por um usuário, com quantidade, finalidade, data de retirada/devolução prevista/real.

## Permissões

- Qualquer usuário logado pode ver os materiais, criar cautelas para si mesmo e devolver suas próprias cautelas.
- Apenas administradores podem cadastrar/editar/remover itens, categorias e estoques, ajustar status manualmente (F.A) e gerenciar usuários (criar, editar, redefinir senha, promover/remover admin). Não há cadastro público.
