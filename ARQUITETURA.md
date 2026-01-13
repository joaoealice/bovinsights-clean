# Documentação da Arquitetura e Fluxo de Uso do BovInsights

## 1. Visão Geral do Projeto

O BovInsights é uma aplicação web moderna projetada para auxiliar pecuaristas no gerenciamento de seus rebanhos. A plataforma oferece ferramentas para controle de lotes de animais, registro de pesagens, manejo de pastagens, controle financeiro e registro de vendas, centralizando informações cruciais para a tomada de decisão no agronegócio.

A aplicação foi construída com foco em uma experiência de usuário limpa e eficiente, garantindo ao mesmo tempo a segurança e a privacidade dos dados de cada usuário.

## 2. Tecnologias Utilizadas

O projeto utiliza um conjunto de tecnologias modernas para desenvolvimento web:

- **Framework:** [Next.js](https://nextjs.org/) (utilizando o App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Backend e Banco de Dados:** [Supabase](https://supabase.io/) (PostgreSQL com autenticação e APIs auto-geradas)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI:** [Shadcn UI](https://ui.shadcn.com/)
- **Gerenciamento de Estado (Client-side):** [Tanstack Query (React Query)](https://tanstack.com/query/latest) para caching de dados do servidor e [Zustand](https://zustand-demo.pmnd.rs/) para estado global da UI.
- **Validação de Formulários:** [React Hook Form](https://react-hook-form.com/)
- **Validação de Esquemas:** [Zod](https://zod.dev/)

## 3. Arquitetura da Aplicação

A arquitetura do BovInsights é dividida em três camadas principais: Frontend, Backend (APIs e services) e Banco de Dados.

### 3.1. Frontend

O frontend é construído com **Next.js** e o **App Router**, o que permite uma arquitetura baseada em componentes que podem ser renderizados tanto no servidor (Server Components) quanto no cliente (Client Components).

- **Renderização no Servidor:** Páginas como `app/dashboard/lotes/page.tsx` são Server Components. Elas buscam dados diretamente da camada de serviço (`lib/services/*.ts`) no servidor antes de enviar a página renderizada para o cliente. Isso resulta em um carregamento inicial mais rápido e melhor SEO.
- **Interatividade no Cliente:** Componentes que exigem interatividade do usuário, como formulários (`components/lotes/LoteForm.tsx`) e modais, são marcados com a diretiva `"use client"` e renderizados no navegador.
- **Roteamento:** O roteamento é baseado no sistema de arquivos do diretório `app`. Rotas protegidas, como as do dashboard, são garantidas pelo `app/dashboard/layout.tsx`, que verifica a existência de uma sessão de usuário no servidor a cada requisição.
- **Gerenciamento de Estado:**
    - **React Query:** Usado para buscar, armazenar em cache e atualizar dados do servidor, simplificando a lógica de `loading` e `error`.
    - **Zustand:** Utilizado para gerenciar estados globais da interface que não são persistidos no banco de dados, como o estado de um menu lateral ou de um modal.

### 3.2. Backend

O backend é composto por uma camada de serviços que abstrai a comunicação com o Supabase e por rotas de API específicas.

- **Camada de Serviços (`lib/services/*.service.ts`):** Esta é a espinha dorsal da lógica de negócios. Cada arquivo de serviço (ex: `lotes.service.ts`, `pesagens.service.ts`) encapsula todas as operações de banco de dados (CRUD - Criar, Ler, Atualizar, Deletar) para uma entidade específica. Isso centraliza a lógica e facilita a manutenção, além de separar as preocupações entre a interface e o acesso a dados.

- **API Routes (`app/api/*`):**
    - **`app/api/satellite/route.ts`:** Esta rota funciona como um gateway seguro para a API da NASA Earth. O frontend envia uma requisição para esta rota, e o servidor Next.js, que possui a chave da API armazenada de forma segura em variáveis de ambiente, faz a chamada para a API externa. Isso evita que a chave da API seja exposta no navegador do cliente.
    - **`proxy.ts`:** Este arquivo configura um proxy para a API do "Melhor Câmbio". O objetivo é contornar problemas de CORS (Cross-Origin Resource Sharing) que ocorrem quando o navegador tenta acessar diretamente uma API em um domínio diferente que não está configurado para permitir tais requisições. O proxy redireciona a chamada através do backend do Next.js, que não tem as mesmas restrições de segurança do navegador.

### 3.3. Banco de Dados

O banco de dados é gerenciado pelo **Supabase**, que utiliza PostgreSQL.

- **Esquema do Banco:** O esquema é definido através de arquivos de migração SQL localizados em `supabase/migrations/`. Arquivos como `supabase_lotes_migration.sql` e `supabase_historico_pesagens_migration.sql` definem as tabelas, colunas, tipos de dados e relacionamentos.
- **Segurança com RLS (Row Level Security):** A segurança e o isolamento dos dados entre os usuários são implementados diretamente no banco de dados através de políticas de RLS. Como visto em `supabase_lotes_migration.sql`, as políticas garantem que um usuário só possa visualizar ou modificar os dados que estão associados ao seu `user_id`. Isso é uma camada de segurança robusta, pois a regra é aplicada no nível do banco de dados, independentemente de como os dados são acessados (seja pela API do Supabase ou diretamente).

## 4. Fluxo de Autenticação de Usuário

1.  **Registro (Signup):** O usuário preenche o formulário na página `/auth/signup`. As informações são enviadas para a API de autenticação do Supabase, que cria um novo usuário na tabela `auth.users` e envia um e-mail de confirmação.
2.  **Login:** O usuário insere suas credenciais na página `/auth/login`. O Supabase verifica as credenciais e, se corretas, gera um token de sessão (JWT) que é armazenado em um cookie seguro e `httpOnly`.
3.  **Gerenciamento de Sessão:** O `app/dashboard/layout.tsx` atua como um guardião para todas as rotas do dashboard. Em cada requisição para uma página do dashboard, este layout utiliza o `createSupabaseServerClient` para verificar, no lado do servidor, se o cookie de sessão é válido.
4.  **Redirecionamento:** Se a sessão for inválida ou não existir, o usuário é imediatamente redirecionado para a página de login (`/auth/login`). Se a sessão for válida, a página solicitada é renderizada.
5.  **Recuperação de Senha:** O usuário solicita a recuperação na página `/auth/forgot-password`, o Supabase envia um link de redefinição para o e-mail cadastrado, e o usuário define uma nova senha na página `/auth/reset-password`.

## 5. Fluxos de Uso das Funcionalidades Principais

### 5.1. Gerenciamento de Lotes

1.  **Visualização:** O usuário acessa `/dashboard/lotes`. O Server Component `page.tsx` chama o `lotes.service.ts` para buscar todos os lotes associados ao `user_id` atual.
2.  **Criação:** O usuário clica em "Novo Lote", abrindo um formulário (ex: `LoteForm.tsx`). Ao submeter, os dados são enviados para a função `createLote` no serviço, que insere um novo registro na tabela `lotes`.
3.  **Atualização/Detalhes:** Ao clicar em um lote específico (`LoteCard.tsx`), o usuário é levado para a página de detalhes (`/dashboard/lotes/[id]`), onde pode ver mais informações ou iniciar a edição.

### 5.2. Pesagens

1.  **Registro:** Dentro da página de um lote, o usuário pode iniciar uma nova pesagem. O formulário `PesagemLoteForm.tsx` coleta os dados de peso dos animais.
2.  **Armazenamento:** Os dados são enviados para o `pesagens.service.ts`, que cria registros na tabela `historico_pesagens`, associando cada pesagem a um lote e a uma data.
3.  **Visualização:** Gráficos como `GraficoEvolucaoPeso.tsx` utilizam os dados da tabela `historico_pesagens` para mostrar a evolução do ganho de peso do lote ao longo do tempo.

### 5.3. Outros Fluxos (Financeiro, Manejo, Vendas)

Os demais fluxos seguem um padrão semelhante:

- **Interface:** Páginas dedicadas no dashboard (`/dashboard/financeiro`, `/dashboard/manejo`, etc.).
- **Componentes:** Componentes de formulário para entrada de dados (`DespesaForm.tsx`, `VendaForm.tsx`).
- **Lógica de Negócios:** Funções específicas na camada de serviço (`financeiro.service.ts`, `vendas.service.ts`) que interagem com o banco de dados Supabase.
- **Segurança:** As políticas de RLS garantem que todas as operações sejam restritas aos dados do usuário logado.

## 6. Estrutura de Diretórios

- **`/app`:** Contém todas as rotas da aplicação, seguindo a convenção do Next.js App Router. Cada pasta representa um segmento da URL.
    - **`/app/api`:** Define as rotas de API do backend.
    - **`/app/dashboard`:** Contém todas as páginas e layouts das rotas protegidas por autenticação.
- **`/components`:** Abriga todos os componentes React reutilizáveis da aplicação, organizados por funcionalidade (ex: `lotes`, `financeiro`, `ui`).
- **`/lib`:** Diretório para código auxiliar e lógica de negócios principal.
    - **`/lib/services`:** A camada de serviço, responsável pela comunicação com o banco de dados.
    - **`/lib/supabase`:** Configuração dos clientes Supabase para o lado do servidor e do cliente.
    - **`/lib/utils`:** Funções utilitárias genéricas (ex: formatação de datas).
- **`/public`:** Arquivos estáticos que são servidos publicamente, como imagens e ícones.
- **`/supabase`:** Configurações relacionadas ao Supabase, principalmente as migrações do esquema do banco de dados.
- **`/types`:** Definições de tipos TypeScript, incluindo os tipos gerados a partir do esquema do banco de dados (`database.types.ts`).

Este documento fornece uma visão abrangente da arquitetura e do funcionamento do sistema BovInsights, servindo como um guia essencial para futuros desenvolvimentos e manutenções.