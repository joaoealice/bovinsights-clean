# 🚀 GUIA DE INÍCIO RÁPIDO - BOVINSIGHTS

## ⚡ COMEÇAR EM 5 MINUTOS

### 1️⃣ ABRA O TERMINAL NO VSCODE

```bash
cd bovinsights-app
```

### 2️⃣ INSTALE AS DEPENDÊNCIAS

```bash
npm install
```

*Isso vai demorar uns 2-3 minutos para baixar tudo*

### 3️⃣ CONFIGURE O SUPABASE

Edite o arquivo `.env.local` e adicione sua chave:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vwlawfsvfnibduovqtjh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI
```

**Como pegar a chave:**
1. Acesse https://supabase.com/dashboard
2. Clique no seu projeto
3. Vá em Settings → API
4. Copie a "anon public" key

### 4️⃣ CRIE A TABELA EXTRA NO SUPABASE

No SQL Editor do Supabase, execute:

```sql
CREATE TABLE public.dashboard_dados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  temperatura DECIMAL(5,2),
  condicao_clima VARCHAR(50),
  valor_arroba DECIMAL(10,2),
  variacao_arroba DECIMAL(5,2),
  status_mercado VARCHAR(20),
  tendencia VARCHAR(50),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.dashboard_dados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seus próprios dados do dashboard"
  ON public.dashboard_dados FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
```

### 5️⃣ RODE O PROJETO

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## ✅ CHECKLIST

- [ ] npm install executado
- [ ] .env.local configurado com a chave do Supabase
- [ ] Tabela dashboard_dados criada
- [ ] npm run dev rodando
- [ ] Consegue acessar http://localhost:3000

---

## 🎯 O QUE ESTÁ PRONTO

✅ Design system completo  
✅ Página de login funcional  
✅ Conexão com Supabase  
✅ Banco de dados configurado  
✅ Sistema de autenticação  

---

## 🚧 PRÓXIMAS TAREFAS

Agora vamos criar:

1. **Página de Signup** (cadastro)
2. **Dashboard** com os 7 KPIs
3. **Sidebar** com menu
4. **Componentes reutilizáveis**
5. **CRUD de Animais**
6. **CRUD de Lotes**
7. E muito mais!

---

## ❓ PROBLEMAS COMUNS

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Invalid Supabase URL"
Verifique se colocou a chave correta no `.env.local`

### Erro ao conectar no banco
Verifique se executou os SQLs de criação das tabelas

---

**TUDO PRONTO!** 🎉

Agora é só me avisar quando estiver rodando para continuarmos! 💪
