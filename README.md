# YourStreet

## Modo de Desenvolvimento com Docker (hot reload)

Para desenvolver sem precisar executar rebuild completo a cada alteração de código, use o override de desenvolvimento:

1. Subir em modo dev:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

2. Depois da primeira subida, para continuar desenvolvendo:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

3. Encerrar os serviços:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### O que esse modo faz

- Frontend com Vite em hot reload via volume montado.
- Backend com dotnet watch para recarregar ao salvar arquivos.
- Sem necessidade de docker compose up --build para cada mudança simples de código.