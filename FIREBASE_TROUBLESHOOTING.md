# 🔧 Solução para Erro de Permissões do Firebase

## ❌ Erro Atual
```
FirebaseError: Missing or insufficient permissions.
```

## ✅ Solução Passo a Passo

### 1. Configurar Regras do Firestore

#### Via Console do Firebase:
1. Acesse [Console do Firebase](https://console.firebase.google.com/)
2. Selecione o projeto `lazavii-financials`
3. Vá para **Firestore Database** > **Regras**
4. Substitua as regras por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Clique em **Publicar**

### 2. Configurar Regras do Storage

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

### 3. Verificar Autenticação

1. Vá para **Authentication** > **Sign-in method**
2. Certifique-se de que **Email/Password** está habilitado
3. Se necessário, adicione domínios autorizados

### 4. Verificar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lazavii-financials.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lazavii-financials
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lazavii-financials.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

### 5. Testar a Configuração

Execute o comando para verificar a configuração:

```bash
npm run check-firebase
```

### 6. Reiniciar o Servidor

```bash
npm run dev
```

## 🔍 Verificações Adicionais

### Se ainda não funcionar:

1. **Verifique se está logado**: O usuário deve estar autenticado
2. **Verifique o console**: Veja se há outros erros
3. **Verifique as regras**: Certifique-se de que foram aplicadas
4. **Verifique o projeto**: Certifique-se de que está no projeto correto

### Logs Esperados Após Correção:

```
🚀 [createFornecedor] Iniciando criação de fornecedor
📝 [createFornecedor] Dados recebidos: {nome: "Teste", contato: "João"}
✅ [createFornecedor] Validação passou, criando documento...
📄 [createFornecedor] Dados do documento: {...}
✅ [createFornecedor] Fornecedor criado com sucesso!
🆔 [createFornecedor] ID do documento: abc123
```

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique os logs no console do navegador
2. Verifique se as regras foram aplicadas no Firebase
3. Verifique se o usuário está autenticado
4. Verifique se as variáveis de ambiente estão corretas
