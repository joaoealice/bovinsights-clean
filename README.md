# 🐮 Bovinsights - Sistema de Gestão Pecuária

**Tecnologia que entende o gado!**

Sistema completo de gestão para fazendas de gado com dashboard interativo, controle de animais, lotes, pesagens, saúde, financeiro e muito mais.

---

## 🚀 Tecnologias Utilizadas

- **Next.js 14** (App Router) - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Backend (Auth + Database + Storage)
- **Zustand** - Gerenciamento de estado
- **Recharts** - Gráficos
- **React Hot Toast** - Notificações
- **Lucide React** - Ícones

---

## 📦 Instalação

### 1. Clone o repositório (ou use esta pasta)

```bash
cd bovinsights-app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o `.env.local` e adicione suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vwlawfsvfnibduovqtjh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Para pegar sua chave do Supabase:**
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **anon/public key**

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Configuração do Banco de Dados

### O banco de dados já foi criado!

Todas as tabelas já foram criadas no Supabase conforme conversamos:

- ✅ **perfil_usuario** - Dados da fazenda
- ✅ **lotes** - Pastos/piquetes
- ✅ **animais** - Cadastro de animais
- ✅ **entradas_lote** - Compra de lotes
- ✅ **pesagens** - Pesagens individuais
- ✅ **pesagens_lote** - Pesagens de lote
- ✅ **movimentacoes_animais** - Transferências
- ✅ **eventos_saude** - Vacinas, vermífugos, etc
- ✅ **despesas** - Controle financeiro
- ✅ **receitas** - Controle financeiro

### Tabela adicional para Dashboard

Você precisa criar UMA tabela extra para os dados do dashboard (Clima, @ do Boi, Mercado):

```sql
-- Tabela para dados do dashboard (clima, cotação, mercado)
CREATE TABLE public.dashboard_dados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Clima
  temperatura DECIMAL(5,2),
  condicao_clima VARCHAR(50), -- "Ensolarado", "Nublado", "Chuvoso"
  
  -- Cotação do Boi (@)
  valor_arroba DECIMAL(10,2),
  variacao_arroba DECIMAL(5,2), -- Percentual de variação
  
  -- Mercado
  status_mercado VARCHAR(20), -- "Alta", "Baixa", "Estável"
  tendencia VARCHAR(50), -- Descrição da tendência
  
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS
ALTER TABLE public.dashboard_dados ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Usuários podem gerenciar seus próprios dados do dashboard"
  ON public.dashboard_dados FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Índices
CREATE INDEX idx_dashboard_dados_usuario_id ON public.dashboard_dados(usuario_id);
CREATE INDEX idx_dashboard_dados_data ON public.dashboard_dados(data_atualizacao DESC);

-- Trigger
CREATE TRIGGER update_dashboard_dados_updated_at
  BEFORE UPDATE ON public.dashboard_dados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 📁 Estrutura do Projeto

```
bovinsights-app/
├── app/
│   ├── auth/
│   │   ├── login/          # Página de login ✅
│   │   ├── signup/         # Página de cadastro (criar)
│   │   └── callback/       # Callback OAuth (criar)
│   ├── dashboard/          # Dashboard principal (criar)
│   ├── animais/            # Gestão de animais (criar)
│   ├── lotes/              # Gestão de lotes (criar)
│   ├── pesagens/           # Controle de pesagens (criar)
│   ├── saude/              # Eventos de saúde (criar)
│   ├── financeiro/         # Controle financeiro (criar)
│   ├── calendario/         # Calendário de eventos (criar)
│   ├── relatorios/         # Relatórios (criar)
│   ├── globals.css         # Estilos globais ✅
│   ├── layout.tsx          # Layout principal ✅
│   └── page.tsx            # Página inicial (redireciona) ✅
├── components/
│   ├── ui/                 # Componentes básicos (criar)
│   ├── dashboard/          # Componentes do dashboard (criar)
│   └── forms/              # Formulários (criar)
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Cliente Supabase (browser) ✅
│   │   └── server.ts       # Cliente Supabase (server) ✅
│   ├── utils/
│   │   └── format.ts       # Funções de formatação ✅
│   └── store.ts            # Zustand stores ✅
├── types/
│   └── database.types.ts   # Tipos do banco de dados ✅
├── public/                 # Arquivos estáticos
├── .env.local              # Variáveis de ambiente ✅
├── .gitignore              # Git ignore ✅
├── next.config.js          # Config do Next.js ✅
├── tailwind.config.ts      # Config do Tailwind ✅
├── tsconfig.json           # Config do TypeScript ✅
└── package.json            # Dependências ✅
```

---

## 🎨 Design System

### Cores

- **Primary (Marrom Couro)**: `#8e6a36`
- **Secondary (Verde Campo)**: `#4c7044`
- **Accent (Laranja Queimado)**: `#da912e`
- **Background**: `#1c1814`
- **Foreground**: `#faf5eb`

### Fontes

- **Display (Títulos)**: Bebas Neue
- **Body (Textos)**: Crimson Pro
- **Mono (Números/Códigos)**: Space Mono

### Componentes

- Cards com efeito couro
- Inputs estilizados
- Botões com animações
- Textura grain no fundo
- Glass effect nos modais

---

## 🔐 Autenticação

O sistema usa **Supabase Auth** que já oferece:

- ✅ Login com email/senha
- ✅ Login social (Google, Facebook, Twitter)
- ✅ Recuperação de senha
- ✅ Sessões automáticas
- ✅ Segurança completa

---

## 📱 Funcionalidades Implementadas

### ✅ Concluído
- Layout principal
- Design system completo
- Página de login funcional
- Conexão com Supabase
- Gerenciamento de estado (Zustand)
- Tipos TypeScript

### 🚧 A Fazer
- Página de cadastro
- Dashboard com KPIs
- CRUD de animais
- CRUD de lotes
- Sistema de pesagens
- Controle de saúde
- Controle financeiro
- Calendário de eventos
- Notificações push
- Relatórios
- Upload de imagens

---

## 🚀 Próximos Passos

1. **Terminar autenticação**: Criar página de signup e callback
2. **Criar dashboard**: Implementar KPIs e gráficos
3. **CRUD de animais**: Listar, cadastrar, editar, deletar
4. **CRUD de lotes**: Listar, cadastrar, editar, deletar
5. **Sistema de notificações**: Integrar Firebase Cloud Messaging

---

## 📚 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter
```

---

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme que as variáveis de ambiente estão corretas
3. Verifique se o banco de dados está configurado no Supabase

---

## 📝 Licença

Projeto privado - Todos os direitos reservados

---

**Desenvolvido com ❤️ para pecuaristas modernos**

*Bovinsights - Tecnologia que entende o gado!* 🐮
