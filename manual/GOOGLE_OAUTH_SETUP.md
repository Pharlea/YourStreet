# 🔧 Configuração Google OAuth - YourStreet

## ❌ Erro: `redirect_uri_mismatch`

Este erro ocorre quando a URL de callback não está autorizada no Google Console.

---

## 🛠️ **Solução: Configurar URLs no Google Console**

### **1. Acesse o Google Console:**
👉 [Google Cloud Console](https://console.cloud.google.com/)

### **2. Navegue para Credenciais:**
- Acesse **APIs & Services** > **Credentials**
- Encontre o OAuth 2.0 Client ID: `242001008359-84nva306jkuv1jm5m4hl5c76erii950v.apps.googleusercontent.com`

### **3. Editar Credenciais:**
Clique em **✏️ Edit** no Client ID

### **4. URLs Autorizadas (Adicione estas):**

#### **JavaScript Origins:**
```
http://localhost:5173
http://localhost:5186
```

#### **Authorized Redirect URIs:**
```
http://localhost:5186/api/auth/callback/google
```

### **5. Salvar:**
Clique em **💾 Save**

---

## 🔄 **URLs Configuradas no Backend**

✅ **Login Endpoint**: `http://localhost:5186/api/auth/login/google`  
✅ **Callback URL**: `http://localhost:5186/api/auth/callback/google`  
✅ **Frontend URL**: `http://localhost:5173`

---

## ⚠️ **URLs Importantes**

Certifique-se de que estas URLs estão no Google Console:

### **Authorized JavaScript Origins:**
- `http://localhost:5173` (Frontend Vite)
- `http://localhost:5186` (Backend ASP.NET)

### **Authorized Redirect URIs:**
- `http://localhost:5186/api/auth/callback/google` (Callback do OAuth)

---

## 🧪 **Teste após Configuração**

1. **Reinicie o backend** (se necessário)
2. **Acesse**: `http://localhost:5173`
3. **Clique**: "Continuar com Google"
4. **Deve funcionar** sem erro redirect_uri_mismatch

---

## 🔧 **Se ainda der erro:**

### Verificar se:
- ✅ URLs estão exatamente como mostrado acima
- ✅ Cliente ID está correto no `appsettings.Development.json`
- ✅ Backend está rodando na porta 5186
- ✅ Frontend está rodando na porta 5173

### Aguardar:
- ⏱️ Mudanças no Google Console podem levar **alguns minutos** para propagar

---

## 📱 **Para Produção (Futuro)**

Substitua `localhost` pelas URLs reais:
```
https://seudominio.com
https://api.seudominio.com/api/auth/callback/google
```