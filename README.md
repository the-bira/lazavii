# Lazavii Financials

Sistema de gestão financeira para negócios de calçados com IA integrada.

## 🚀 Funcionalidades

- **Gestão de Fornecedores**: CRUD completo com upload de fotos
- **Gestão de Produtos**: Controle de estoque e preços
- **Vendas**: Sistema de múltiplos produtos por venda
- **Custos**: Controle de custos operacionais
- **Metas**: Definição e acompanhamento de metas com IA
- **Dashboard**: Visão geral com gráficos e insights
- **Relatórios**: Exportação de relatórios detalhados
- **IA Integrada**: Insights e planos estratégicos com Gemini

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui
- **Backend**: Firebase (Firestore, Storage, Auth)
- **IA**: Google Gemini API
- **Gráficos**: Recharts

## 📋 Pré-requisitos

- Node.js 18+
- Conta Firebase
- Chave API do Gemini

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd lazavii-financials
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp env.example .env.local
```

Preencha as variáveis:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_GEMINI_API_KEY`

### 4. Configure o Firebase
```bash
# Instale o Firebase CLI
npm install -g firebase-tools

# Faça login no Firebase
firebase login

# Inicialize o projeto (se necessário)
firebase init
```

### 5. Execute o projeto
```bash
npm run dev
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa linter
- `firebase emulators:start` - Executa emuladores locais

## 📁 Estrutura do Projeto

```
├── app/                    # Páginas da aplicação
│   ├── dashboard/          # Dashboard principal
│   ├── vendas/            # Gestão de vendas
│   ├── custos/            # Gestão de custos
│   ├── fornecedores/      # Gestão de fornecedores
│   ├── metas/             # Gestão de metas
│   └── relatorios/        # Relatórios
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI
│   └── main-layout.tsx   # Layout principal
├── lib/                  # Utilitários e configurações
│   ├── firebase.ts       # Configuração Firebase
│   ├── firebase-functions.ts # Funções do Firebase
│   └── types.ts          # Tipos TypeScript
└── public/               # Arquivos estáticos
```

## 🔐 Segurança

O projeto usa regras de segurança do Firebase configuradas em:
- `firestore.rules` - Regras do Firestore
- `storage.rules` - Regras do Storage

## 📊 Coleções do Firestore

- `fornecedores` - Dados dos fornecedores
- `produtos` - Catálogo de produtos
- `vendas` - Registro de vendas
- `custos` - Custos operacionais
- `metas` - Metas e planos
- `insights` - Insights gerados pela IA
- `logs` - Logs do sistema
- `extornos` - Extornos de vendas

## 🤖 IA Integrada

O sistema usa a API do Gemini para:
- Gerar insights baseados nos dados
- Criar planos estratégicos para metas
- Análise de performance do negócio

## 📈 Dashboard

O dashboard mostra:
- Receita bruta e lucro líquido
- Custos operacionais
- Gráficos de vendas vs custos
- Insights inteligentes
- Performance por fornecedor

## 🚀 Deploy

Para fazer deploy no Firebase Hosting:

```bash
npm run build
firebase deploy
```

## 📝 Licença

Este projeto é privado e proprietário.
