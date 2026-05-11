# FerramentasTrack — PWA com banco de dados em tempo real

App de controle de ferramentas para obras, com sincronização em tempo real entre todos os celulares via Supabase.

---

## 🗄️ PASSO 1 — Criar o banco de dados no Supabase (gratuito)

### 1.1 Criar conta
Acesse https://supabase.com e clique em **Start your project** (entre com Google ou GitHub).

### 1.2 Criar projeto
1. Clique em **New project**
2. Nome: `ferramentas-track`
3. Crie uma senha forte (salve em algum lugar)
4. Região: **South America (São Paulo)**
5. Clique em **Create new project** — aguarde ~2 minutos

### 1.3 Criar as tabelas
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `supabase_schema.sql` deste projeto
4. Cole todo o conteúdo no editor
5. Clique em **Run** (▶)
6. Deve aparecer "Success" — as tabelas foram criadas!

### 1.4 Pegar as credenciais
1. No menu lateral, vá em **Settings → API**
2. Copie os dois valores:
   - **Project URL** → algo como `https://xyzxyz.supabase.co`
   - **anon public key** → uma chave longa começando com `eyJ...`

---

## 🚀 PASSO 2 — Publicar no Vercel (gratuito)

### 2.1 Criar repositório no GitHub
1. Acesse https://github.com e crie uma conta se não tiver
2. Clique em **New repository**
3. Nome: `ferramentas-track` → **Create repository**
4. Faça upload de todos os arquivos deste projeto (arraste a pasta inteira)

### 2.2 Publicar no Vercel
1. Acesse https://vercel.com → **Sign Up with GitHub**
2. Clique em **Add New Project**
3. Selecione o repositório `ferramentas-track`
4. **ANTES de clicar em Deploy**, clique em **Environment Variables** e adicione:

   | Nome                    | Valor                              |
   |-------------------------|------------------------------------|
   | `VITE_SUPABASE_URL`     | sua Project URL do Supabase        |
   | `VITE_SUPABASE_ANON_KEY`| sua anon public key do Supabase    |

5. Clique em **Deploy**
6. Em ~1 minuto você recebe o link, ex: `ferramentas-track.vercel.app`

---

## 📱 PASSO 3 — Instalar no celular

### Android (Chrome)
1. Abra o link no Chrome
2. Menu ⋮ → **"Adicionar à tela inicial"**

### iPhone (Safari)
1. Abra o link no **Safari** (não Chrome)
2. Botão compartilhar → **"Adicionar à Tela de Início"**

---

## 🔗 Compartilhar com a equipe

Envie o link pelo WhatsApp. Qualquer ação feita em um celular aparece automaticamente em todos os outros em tempo real.

O ponto verde (●) no topo do app indica que está conectado ao banco de dados.

---

## 🛠️ Rodar localmente para desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Criar o .env com suas credenciais
cp .env.example .env
# Edite o .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 3. Rodar
npm run dev
# Acesse http://localhost:5173
```

---

## ❓ Dúvidas frequentes

**Os dados somem se eu desinstalar o app?**
Não — os dados ficam no Supabase (nuvem), não no celular.

**Quantas pessoas podem usar ao mesmo tempo?**
O plano gratuito do Supabase suporta até 500 MB de dados e conexões simultâneas suficientes para equipes de obra.

**Posso usar sem internet?**
O app abre offline, mas não consegue salvar ou carregar dados novos sem conexão.
