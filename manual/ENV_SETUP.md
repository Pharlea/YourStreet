# Configuração de Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para proteger dados sensíveis. Siga as instruções abaixo para configurar seu ambiente de desenvolvimento.

## Backend (.NET)

1. **Copie o arquivo de exemplo:**
   ```bash
   cd backend/your-street-server
   cp .env.example .env
   ```

2. **Edite o arquivo `.env` com suas credenciais:**
   ```env
   # Configurações do Banco de Dados
   CONNECTION_STRING=Data Source=yourstreet.db

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=seu_google_client_id_aqui
   GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui

   # URLs
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5186

   # Ambiente
   ASPNETCORE_ENVIRONMENT=Development
   ```

## Frontend (React + Vite)

1. **Copie o arquivo de exemplo:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **O arquivo `.env` do frontend já deve estar configurado:**
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:5186/api
   ```

## Como obter as credenciais do Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ ou Google Identity
4. Vá para "Credenciais" > "Criar Credenciais" > "ID do cliente OAuth 2.0"
5. Configure as URLs autorizadas:
   - **Origins autorizados:** `http://localhost:5186`
   - **URIs de redirecionamento:** `http://localhost:5186/api/auth/callback/google`
6. Copie o `Client ID` e `Client Secret` para seu arquivo `.env`

## Importante

- **NUNCA** commite arquivos `.env` para o Git
- Os arquivos `.env.example` servem como template e podem ser commitados
- O arquivo `.gitignore` já está configurado para ignorar os arquivos `.env`

## Executando o Projeto

Após configurar as variáveis de ambiente:

```bash
# Backend
cd backend/your-street-server
dotnet run

# Frontend (em outro terminal)
cd frontend
npm run dev
```