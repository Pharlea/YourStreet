# Configuração de Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para proteger dados sensíveis. Siga as instruções abaixo para configurar seu ambiente de desenvolvimento.

## Backend (.NET)

1. **Prepare o arquivo de ambiente (`.env`):**
   Crie um novo `.env` no diretório `backend/your-street-server` ou edite o existente.
   Exemplo de conteúdo:
   ```env
   # Configurações do Banco de Dados
   CONNECTION_STRING=Data Source=yourstreet.db

   # Google OAuth Configuration (backend)
   GOOGLE_CLIENT_ID=seu_google_client_id_aqui
   GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui

   # Google OAuth Configuration (frontend)
   VITE_GOOGLE_CLIENT_ID=seu_google_client_id_aqui  # usado pelo código React via import.meta.env

   # URLs
   FRONTEND_URL=http://localhost:5174
   BACKEND_URL=https://yourstreet-afh0echkdsbqf6ft.brazilsouth-01.azurewebsites.net

   # Ambiente
   ASPNETCORE_ENVIRONMENT=Development
   ```

## Frontend (React + Vite)

1. **Defina o arquivo de ambiente `.env`:**
   Crie ou atualize `frontend/.env` com a URL da API.
   ```env
   # API Configuration
   VITE_API_URL=https://yourstreet-afh0echkdsbqf6ft.brazilsouth-01.azurewebsites.net/api
   ```

## Como obter as credenciais do Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ ou Google Identity
4. Vá para "Credenciais" > "Criar Credenciais" > "ID do cliente OAuth 2.0"
5. Configure as URLs autorizadas:
   - **Origins autorizados:** `https://yourstreet-afh0echkdsbqf6ft.brazilsouth-01.azurewebsites.net`
   - **URIs de redirecionamento:** `https://yourstreet-afh0echkdsbqf6ft.brazilsouth-01.azurewebsites.net/api/auth/callback/google`
6. Copie o `Client ID` e `Client Secret` para seu arquivo `.env`

## Importante

- **NUNCA** commite arquivos `.env` para o Git
- O arquivo `.gitignore` já está configurado para ignorar os arquivos `.env`
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