# BovInsights - Documentacao de Migracoes e Alteracoes

## Data: 03/01/2026

---

## 1. MIGRACAO NEXT.JS 16 (Middleware para Proxy)

### Problema
Next.js 16 deprecou o arquivo `middleware.ts` em favor de `proxy.ts`.

### Arquivos Criados

#### `proxy.ts` (raiz do projeto)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### `app/dashboard/DashboardLayoutClient.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  initialUserName: string
  initialFarmName: string
}

export default function DashboardLayoutClient({
  children,
  initialUserName,
  initialFarmName,
}: DashboardLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState(initialUserName)
  const [farmName, setFarmName] = useState(initialFarmName)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🐮', label: 'Animais', href: '/dashboard/animais' },
    { icon: '📍', label: 'Lotes', href: '/dashboard/lotes' },
    { icon: '⚖️', label: 'Pesagens', href: '/dashboard/pesagens' },
    { icon: '💉', label: 'Manejo', href: '/dashboard/manejo' },
    { icon: '💰', label: 'Financeiro', href: '/dashboard/financeiro' },
    { icon: '🎯', label: 'Vendas', href: '/dashboard/vendas' },
    { icon: '📅', label: 'Calendario', href: '/dashboard/calendario' },
    { icon: '📄', label: 'Relatorios', href: '/dashboard/relatorios' },
  ]

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'DASHBOARD'
    if (pathname?.includes('/animais/novo')) return 'CADASTRAR ANIMAL'
    if (pathname?.includes('/animais') && pathname?.includes('/editar')) return 'EDITAR ANIMAL'
    if (pathname?.match(/\/animais\/[^\/]+$/)) return 'DETALHES DO ANIMAL'
    if (pathname?.includes('/animais')) return 'ANIMAIS'
    if (pathname?.includes('/lotes/novo')) return 'CRIAR LOTE'
    if (pathname?.includes('/lotes') && pathname?.includes('/editar')) return 'EDITAR LOTE'
    if (pathname?.includes('/lotes/')) return 'DETALHES DO LOTE'
    if (pathname?.includes('/lotes')) return 'LOTES'
    if (pathname?.includes('/pesagens/novo')) return 'NOVA PESAGEM'
    if (pathname?.includes('/pesagens/lote')) return 'PESAGEM EM LOTE'
    if (pathname?.includes('/pesagens')) return 'PESAGENS'
    if (pathname?.includes('/manejo/novo')) return 'NOVO MANEJO'
    if (pathname?.includes('/manejo') && pathname?.includes('/editar')) return 'EDITAR MANEJO'
    if (pathname?.match(/\/manejo\/[^\/]+$/)) return 'DETALHES DO MANEJO'
    if (pathname?.includes('/manejo')) return 'MANEJO'
    if (pathname?.includes('/vendas/novo')) return 'NOVA VENDA'
    if (pathname?.includes('/vendas') && pathname?.includes('/editar')) return 'EDITAR VENDA'
    if (pathname?.match(/\/vendas\/[^\/]+$/)) return 'DETALHES DA VENDA'
    if (pathname?.includes('/vendas')) return 'VENDAS'
    if (pathname?.includes('/financeiro')) return 'FINANCEIRO'
    if (pathname?.includes('/calendario')) return 'CALENDARIO'
    if (pathname?.includes('/relatorios')) return 'RELATORIOS'
    return 'BOVINSIGHTS'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 hover:w-72 bg-card border-r border-border transition-all duration-300 z-50 overflow-hidden group">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Image
              src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
              alt="Bovinsights"
              width={200}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all text-lg ${
                isActive(item.href)
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4 space-y-2">
          <button className="w-full flex items-center gap-4 px-4 py-4 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all text-lg">
            <span className="text-2xl flex-shrink-0">⚙️</span>
            <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Configuracoes
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-lg text-error hover:bg-error/10 transition-all text-lg"
          >
            <span className="text-2xl flex-shrink-0">🚪</span>
            <span className="font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 transition-all duration-300">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-6">
              <Image
                src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/Bovinsights%20(2).png"
                alt="Bovinsights"
                width={140}
                height={35}
                className="h-10 w-auto"
              />
              <div className="border-l border-border pl-6">
                <h2 className="font-display text-3xl text-foreground">{getPageTitle()}</h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-3 hover:bg-muted rounded-lg transition-colors">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-error rounded-full text-sm flex items-center justify-center text-white font-bold">
                  3
                </span>
              </button>

              <div className="flex items-center gap-4 pl-4 border-l border-border">
                <div className="text-right hidden md:block">
                  <p className="font-body font-semibold text-lg text-foreground">{userName}</p>
                  <p className="text-sm text-muted-foreground">{farmName}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="font-display text-xl text-white">
                    {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

#### `app/dashboard/layout.tsx` (Server Component)
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  const userName = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuario'

  const { data: profile } = await supabase
    .from('perfil_usuario')
    .select('nome_fazenda')
    .eq('usuario_id', user.id)
    .single()

  const farmName = profile?.nome_fazenda || 'Minha Fazenda'

  return (
    <DashboardLayoutClient
      initialUserName={userName}
      initialFarmName={farmName}
    >
      {children}
    </DashboardLayoutClient>
  )
}
```

#### `app/auth/layout.tsx`
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
```

### Arquivo Removido
- `middleware.ts` (substituido por `proxy.ts`)

---

## 2. CORRECOES NO SERVICO DE LOTES

### Arquivo: `lib/services/lotes.service.ts`

Alterado para usar foreign key explicita nas queries:

```typescript
// ANTES:
.select(`
  *,
  animais(id, peso_atual)
`)

// DEPOIS:
.select(`
  *,
  animais!fk_animais_lote(id, peso_atual)
`)
```

Todas as 3 ocorrencias foram alteradas (getLotes, getLoteById, searchLotes).

---

## 3. TABELAS DO SUPABASE

### Tabelas Existentes (ja tinham):
- `animais`
- `lotes`
- `market_prices`
- `market_indicators`

### Tabelas Criadas:
- `manejos`
- `vendas`
- `pesagens`
- `despesas`
- `perfil_usuario`

### Colunas Adicionadas:
- `animais.peso_atual` (DECIMAL 10,2)
- `market_prices.is_current` (BOOLEAN)
- `market_indicators.is_current` (BOOLEAN)

### Foreign Keys Adicionadas:
- `fk_animais_lote` (animais.lote_id -> lotes.id)

---

## 4. SQL COMPLETO DAS TABELAS

### SQL para criar tabela `manejos`:
```sql
CREATE TABLE IF NOT EXISTS manejos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  tipo_aplicacao VARCHAR(50) NOT NULL DEFAULT 'lote_inteiro',
  animais_ids UUID[] DEFAULT NULL,
  tipo_manejo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  data_manejo DATE NOT NULL,
  vacinas TEXT[] DEFAULT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT tipo_manejo_valido CHECK (tipo_manejo IN ('vermifugo', 'vacinacao', 'suplementacao', 'marcacao', 'castracao', 'desmama', 'outros')),
  CONSTRAINT tipo_aplicacao_valido CHECK (tipo_aplicacao IN ('lote_inteiro', 'animais_individuais'))
);

CREATE INDEX IF NOT EXISTS idx_manejos_usuario_id ON manejos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_manejos_lote_id ON manejos(lote_id);
CREATE INDEX IF NOT EXISTS idx_manejos_tipo_manejo ON manejos(tipo_manejo);
CREATE INDEX IF NOT EXISTS idx_manejos_data_manejo ON manejos(data_manejo DESC);

ALTER TABLE manejos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver seus proprios manejos" ON manejos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuarios podem criar seus proprios manejos" ON manejos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuarios podem atualizar seus proprios manejos" ON manejos FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuarios podem deletar seus proprios manejos" ON manejos FOR DELETE USING (auth.uid() = usuario_id);
```

### SQL para criar tabela `vendas`:
```sql
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  data_venda DATE NOT NULL,
  quantidade_cabecas INTEGER NOT NULL CHECK (quantidade_cabecas > 0),
  peso_total_kg DECIMAL(12, 2) NOT NULL CHECK (peso_total_kg > 0),
  peso_total_arrobas DECIMAL(12, 2) NOT NULL,
  preco_arroba_venda DECIMAL(10, 2) NOT NULL CHECK (preco_arroba_venda > 0),
  valor_total_venda DECIMAL(14, 2) NOT NULL,
  custo_total DECIMAL(14, 2) NOT NULL DEFAULT 0,
  lucro_bruto DECIMAL(14, 2) NOT NULL,
  margem_percentual DECIMAL(6, 2) NOT NULL,
  atingiu_objetivo BOOLEAN NOT NULL DEFAULT false,
  comprador VARCHAR(255),
  observacoes TEXT,
  post_mortem_data DATE,
  post_mortem_frigorifico VARCHAR(255),
  post_mortem_rendimento_carcaca DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendas_select" ON vendas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "vendas_insert" ON vendas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "vendas_update" ON vendas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "vendas_delete" ON vendas FOR DELETE USING (auth.uid() = usuario_id);
```

### SQL para criar tabela `pesagens`:
```sql
CREATE TABLE IF NOT EXISTS pesagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  peso DECIMAL(10, 2) NOT NULL CHECK (peso > 0),
  data_pesagem DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE pesagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pesagens_select" ON pesagens FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "pesagens_insert" ON pesagens FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "pesagens_update" ON pesagens FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "pesagens_delete" ON pesagens FOR DELETE USING (auth.uid() = usuario_id);
```

### SQL para criar tabela `despesas`:
```sql
CREATE TABLE IF NOT EXISTS despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL CHECK (valor > 0),
  data_despesa DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT categoria_valida CHECK (categoria IN ('suplementacao', 'sal_mineral', 'medicamentos', 'mao_de_obra', 'eletricidade', 'manutencao', 'outros'))
);

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "despesas_select" ON despesas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "despesas_insert" ON despesas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "despesas_update" ON despesas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "despesas_delete" ON despesas FOR DELETE USING (auth.uid() = usuario_id);
```

### SQL para criar tabela `perfil_usuario`:
```sql
CREATE TABLE IF NOT EXISTS perfil_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome_fazenda VARCHAR(255),
  localizacao VARCHAR(255),
  telefone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfil_select" ON perfil_usuario FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "perfil_insert" ON perfil_usuario FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "perfil_update" ON perfil_usuario FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "perfil_delete" ON perfil_usuario FOR DELETE USING (auth.uid() = usuario_id);
```

---

## 5. OTIMIZACAO MARKET DATA (is_current)

### SQL para adicionar coluna is_current e triggers:
```sql
-- Adicionar coluna is_current nas tabelas
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;
ALTER TABLE market_indicators ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- Criar indices para performance
CREATE INDEX IF NOT EXISTS idx_market_prices_is_current ON market_prices(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_market_indicators_is_current ON market_indicators(is_current) WHERE is_current = true;

-- Trigger para market_prices
CREATE OR REPLACE FUNCTION update_market_prices_current()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE market_prices SET is_current = false WHERE is_current = true;
  NEW.is_current = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_market_prices_current ON market_prices;
CREATE TRIGGER trigger_market_prices_current
  BEFORE INSERT ON market_prices
  FOR EACH ROW EXECUTE FUNCTION update_market_prices_current();

-- Trigger para market_indicators
CREATE OR REPLACE FUNCTION update_market_indicators_current()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE market_indicators SET is_current = false WHERE is_current = true;
  NEW.is_current = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_market_indicators_current ON market_indicators;
CREATE TRIGGER trigger_market_indicators_current
  BEFORE INSERT ON market_indicators
  FOR EACH ROW EXECUTE FUNCTION update_market_indicators_current();

-- Marcar registros existentes como atuais
UPDATE market_prices SET is_current = true
WHERE reference_date = (SELECT MAX(reference_date) FROM market_prices);

UPDATE market_indicators SET is_current = true
WHERE reference_date = (SELECT MAX(reference_date) FROM market_indicators);
```

---

## 6. PENDENCIAS / PROXIMOS PASSOS

1. **Atualizar `mercado.service.ts`** para usar `is_current = true` nas queries (mais performatico)
2. **Testar todas as paginas** do sistema
3. **Criar testes automatizados** para as funcionalidades principais

---

## 7. ESTRUTURA FINAL DAS TABELAS NO SUPABASE

| Tabela | Descricao | RLS |
|--------|-----------|-----|
| animais | Cadastro de animais | Sim |
| lotes | Cadastro de lotes | Sim |
| manejos | Registro de manejos sanitarios | Sim |
| vendas | Registro de vendas | Sim |
| pesagens | Historico de pesagens | Sim |
| despesas | Controle financeiro | Sim |
| perfil_usuario | Perfil da fazenda | Sim |
| market_prices | Cotacoes do mercado | Nao |
| market_indicators | Indicadores do mercado | Nao |

---

## 8. VARIAVEIS DE AMBIENTE (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://vwlawfsvfnibduovqtjh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

Documentacao gerada automaticamente em 03/01/2026
