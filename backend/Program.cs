using Microsoft.EntityFrameworkCore;
using your_street_server.Data;
using DotNetEnv;
using Microsoft.AspNetCore.ResponseCompression;

// Carregar variáveis de ambiente do arquivo .env (se existir)
if (File.Exists(".env"))
{
    Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Swagger / OpenAPI (Swashbuckle)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "YourStreet API", Version = "v1" });
});

// Configurar Entity Framework com PostgreSQL
var dbConnectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string nao configurada. Defina CONNECTION_STRING ou ConnectionStrings:DefaultConnection.");

builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseNpgsql(dbConnectionString));

builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "application/json" });
});

// Configurar cache para sessões
builder.Services.AddDistributedMemoryCache();

// Configurar sessões
builder.Services.AddSession(options =>
{
    options.Cookie.Name = ".YourStreet.Session";
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// Configurar CORS
builder.Services.AddCors(options =>
{
        options.AddDefaultPolicy(builder =>
        {
            var corsOrigin = Environment.GetEnvironmentVariable("CORS_ORIGIN") ?? "http://localhost:5173";
            var allowedOrigins = corsOrigin.Split(',').Select(o => o.Trim()).ToArray();
            
            builder.WithOrigins(allowedOrigins)
                   .WithOrigins("http://localhost:5173", "https://localhost:5173")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials(); // Importante para cookies de sessão
        });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Adicionar health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "YourStreet API V1");
    });

    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHttpsRedirection();
}

// Aplicar CORS
app.UseCors();
app.UseResponseCompression();

// Usar sessões (deve vir antes da autorização)
app.UseSession();

app.UseAuthorization();

app.MapControllers();

// Mapear health checks
app.MapHealthChecks("/health");

// Aplicar migrações automaticamente durante o desenvolvimento
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
    }
}

app.Run();
