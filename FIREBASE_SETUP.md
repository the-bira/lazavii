# Configuração do Firebase

## 1. Configurar Regras do Firestore

### Opção A: Via Console do Firebase
1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto `lazavii-financials`
3. Vá para **Firestore Database** > **Regras**
4. Substitua as regras existentes por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para fornecedores
    match /fornecedores/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para produtos
    match /produtos/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para vendas
    match /vendas/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para custos
    match /custos/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para metas
    match /metas/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para logs
    match /logs/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Regras para usuários
    match /usuarios/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Clique em **Publicar**

### Opção B: Via Firebase CLI
```bash
firebase deploy --only firestore:rules
```

## 2. Configurar Storage Rules

1. Vá para **Storage** > **Regras**
2. Substitua as regras por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **Publicar**

## 3. Verificar Configuração de Autenticação

1. Vá para **Authentication** > **Sign-in method**
2. Certifique-se de que **Email/Password** está habilitado
3. Adicione domínios autorizados se necessário

## 4. Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` contém:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lazavii-financials
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

## 5. Testar a Configuração

1. Faça login na aplicação
2. Tente criar um fornecedor
3. Verifique se não há mais erros de permissão

## Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verifique se as regras do Firestore foram aplicadas
- Verifique se o usuário está autenticado
- Verifique se as regras permitem operações de escrita

### Erro: "Firebase Storage not configured"
- Verifique se o Storage está habilitado no projeto
- Verifique se as regras do Storage foram aplicadas

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Verifique se o projeto está ativo no Firebase
