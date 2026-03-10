# YourStreet Server - Sistema de Login com Google OAuth

Este é um sistema de login simples e funcional usando Google OAuth2 e armazenamento em SQLite. O projeto foi implementado em ASP.NET Core 9.0.

## Funcionalidades

- ✅ Autenticação via Google OAuth2
- ✅ Armazenamento de usuários em SQLite
- ✅ API RESTful
- ✅ Criação/atualização automática de usuários
- ✅ Middleware de autenticação e autorização

## Estrutura do Projeto

```
├── Controllers/
│   ├── AuthController.cs        # Controlador de autenticação
│   └── WeatherForecastController.cs
├── Data/
│   └── AppDbContext.cs          # Contexto do Entity Framework
├── Models/
│   └── User.cs                  # Modelo de usuário
├── Migrations/                  # Migrações do Entity Framework
├── Program.cs                   # Configuração da aplicação
├── appsettings.json            # Configurações da aplicação
└── yourstreet.db               # Banco de dados SQLite
```

## Configuração do Google OAuth

### 1. Criar Credenciais no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite a "Google+ API"
4. Vá para "Credenciais" → "Criar credenciais" → "ID do cliente OAuth"
5. Selecione "Aplicação da web"
6. Configure as URIs autorizadas:
   - **Origens JavaScript autorizadas**: `https://localhost:7186`
   - **URIs de redirecionamento autorizadas**: `https://localhost:7186/signin-google`

### 2. Configurar as Credenciais na Aplicação

Edite os arquivos `appsettings.json` e `appsettings.Development.json`:

```json
{
  "Authentication": {
    "Google": {
      "ClientId": "SEU_GOOGLE_CLIENT_ID_AQUI",
      "ClientSecret": "SEU_GOOGLE_CLIENT_SECRET_AQUI"
    }
  }
}
```

## Endpoints da API

### Autenticação

- `GET /api/auth/login/google` - Inicia o processo de login com Google
- `GET /api/auth/callback/google` - Callback do Google OAuth (usado automaticamente)
- `POST /api/auth/logout` - Faz logout do usuário autenticado
- `GET /api/auth/profile` - Retorna informações do usuário autenticado

## Como Executar

1. **Instalar dependências**:
   ```bash
   dotnet restore
   ```

2. **Configurar Google OAuth** (veja seção acima)

3. **Executar a aplicação**:
   ```bash
   dotnet run
   dotnet run --launch-profile https
   ```

4. **Testar o login**:
   - Acesse `https://localhost:7186/api/auth/login/google`
   - Você será redirecionado para o Google para fazer login
   - Após o login, será redirecionado de volta com seus dados

## Estrutura do Banco de Dados

### Tabela Users

| Campo        | Tipo     | Descrição                    |
|--------------|----------|------------------------------|
| Id           | INTEGER  | Chave primária (auto-increment) |
| GoogleId     | TEXT     | ID único do Google (único)   |
| Email        | TEXT     | Email do usuário (único)     |
| Name         | TEXT     | Nome do usuário              |
| Picture      | TEXT     | URL da foto de perfil        |
| CreatedAt    | TEXT     | Data de criação              |
| LastLoginAt  | TEXT     | Último login                 |

## Pacotes NuGet Utilizados

- `Microsoft.EntityFrameworkCore.Sqlite` (9.0.3)
- `Microsoft.AspNetCore.Authentication.Google` (9.0.3)
- `Microsoft.EntityFrameworkCore.Tools` (9.0.3)

## Próximos Passos Sugeridos

1. **Implementar JWT**: Para uma autenticação mais robusta entre requests
2. **Adicionar middleware de autorização**: Para proteger endpoints específicos
3. **Implementar refresh tokens**: Para manter usuários logados
4. **Adicionar logs**: Para monitoramento e debugging
5. **Adicionar testes unitários**: Para garantir a qualidade do código

## Troubleshooting

### Erro "Origem não autorizada"

Certifique-se de que a URL `https://localhost:7186` está configurada nas origens autorizadas no Google Cloud Console.

### Erro "URI de redirecionamento inválido"

Adicione `https://localhost:7186/signin-google` às URIs de redirecionamento autorizadas no Google Cloud Console.

### Erro de SSL/HTTPS

Execute o comando para confiar no certificado de desenvolvimento:

```bash
dotnet dev-certs https --trust
```