using Microsoft.EntityFrameworkCore;
using your_street_server.Data;
using DotNetEnv;

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

// Configurar Entity Framework com SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Usar sessões (deve vir antes da autorização)
app.UseSession();

app.UseAuthorization();

app.MapControllers();

// Aplicar migrações automaticamente durante o desenvolvimento
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
    }
}

app.Run();
