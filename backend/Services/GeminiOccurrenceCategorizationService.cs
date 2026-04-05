using System.Text;
using System.Text.Json;

namespace your_street_server.Services;

public class GeminiOccurrenceCategorizationService : IOccurrenceCategorizationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiOccurrenceCategorizationService> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiOccurrenceCategorizationService(
        HttpClient httpClient,
        ILogger<GeminiOccurrenceCategorizationService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? Environment.GetEnvironmentVariable("GOOGLE_AI_API_KEY")
            ?? configuration["Gemini:ApiKey"]
            ?? string.Empty;

        _model = Environment.GetEnvironmentVariable("GEMINI_MODEL")
            ?? configuration["Gemini:Model"]
            ?? "gemini-2.0-flash";
    }

    public async Task<string> CategorizeAsync(string description)
    {
        var fallbackCategory = CategorizeByKeyword(description);

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("GEMINI_API_KEY nao configurada. Usando classificacao por palavras-chave.");
            return fallbackCategory;
        }

        try
        {
            var prompt = BuildPrompt(description);
            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

            var body = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var response = await _httpClient.PostAsync(
                endpoint,
                new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini retornou status {Status}. Usando fallback.", response.StatusCode);
                return fallbackCategory;
            }

            var content = await response.Content.ReadAsStringAsync();
            var category = ExtractCategoryFromGeminiResponse(content);
            if (!string.IsNullOrWhiteSpace(category))
            {
                return category;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao classificar com Gemini. Usando fallback.");
        }

        return fallbackCategory;
    }

    private static string BuildPrompt(string description)
    {
        var categories = string.Join(", ", OccurrenceCategoryCatalog.All.Select(item => item.Key));

        return $"""
Classifique a ocorrência urbana abaixo em UMA categoria da lista permitida.

Lista de categorias permitidas:
{categories}

Descricao da ocorrência:
{description}

Responda SOMENTE com a chave da categoria (sem frase, sem JSON, sem markdown).
Se estiver em duvida, responda: {OccurrenceCategoryCatalog.DefaultCategory}
""";
    }

    private static string? ExtractCategoryFromGeminiResponse(string responseJson)
    {
        using var document = JsonDocument.Parse(responseJson);

        if (!document.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return null;
        }

        var text = candidates[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var normalized = text.Trim().ToLowerInvariant()
            .Replace("`", string.Empty)
            .Replace("\"", string.Empty)
            .Replace("'", string.Empty);

        var line = normalized.Split('\n', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();
        var candidate = line ?? normalized;

        if (OccurrenceCategoryCatalog.AllowedKeys.Contains(candidate))
        {
            return candidate;
        }

        // Fallback when model answers with extra text but still includes a valid key.
        foreach (var key in OccurrenceCategoryCatalog.AllowedKeys)
        {
            if (candidate.Contains(key, StringComparison.OrdinalIgnoreCase))
            {
                return key;
            }
        }

        return null;
    }

    private static string CategorizeByKeyword(string description)
    {
        var text = (description ?? string.Empty).Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(text))
        {
            return OccurrenceCategoryCatalog.DefaultCategory;
        }

        if (ContainsAny(text, "buraco", "cratera", "asfalto quebrado", "asfalto afundado")) return "buraco_via";
        if (ContainsAny(text, "pavimento", "paralelepipedo solto", "via danificada")) return "pavimento_danificado";
        if (ContainsAny(text, "erosao", "vocoroca", "barranco cedendo")) return "erosao_via";
        if (ContainsAny(text, "bueiro", "boca de lobo", "tampa", "entupido")) return "bueiro_entupido";
        if (ContainsAny(text, "alag", "enchente", "inund", "agua acumulada")) return "alagamento";
        if (ContainsAny(text, "drenagem", "escoamento", "galeria pluvial")) return "drenagem_insuficiente";
        if (ContainsAny(text, "vazamento", "cano estourado", "agua vazando")) return "vazamento_agua";
        if (ContainsAny(text, "falta de agua", "sem agua")) return "falta_agua";
        if (ContainsAny(text, "esgoto", "mau cheiro", "ceu aberto")) return "esgoto_a_ceu_aberto";
        if (ContainsAny(text, "semaforo", "farol apagado", "sinal apagado")) return "semaforo_apagado";
        if (ContainsAny(text, "sinalizacao", "placa", "faixa apagada")) return "sinalizacao_danificada";
        if (ContainsAny(text, "iluminacao", "poste sem luz", "luminaria")) return "iluminacao_publica_apagada";
        if (ContainsAny(text, "poste caindo", "poste inclinado", "fio caido")) return "poste_risco_queda";
        if (ContainsAny(text, "arvore caindo", "galho", "queda de arvore")) return "arvore_risco_queda";
        if (ContainsAny(text, "lixo", "entulho", "sujeira acumulada")) return "lixo_acumulado";
        if (ContainsAny(text, "descarte irregular", "despejo irregular", "residuo")) return "descarte_irregular";
        if (ContainsAny(text, "acidente", "colisao", "batida", "atropelamento")) return "acidente_transito";
        if (ContainsAny(text, "animal", "cavalo", "boi", "cachorro na pista")) return "animal_solto_via";
        if (ContainsAny(text, "obra irregular", "obra sem sinalizacao", "interdicao")) return "obra_irregular";
        if (ContainsAny(text, "calcada", "passeio", "buraco na calcada")) return "calcada_danificada";
        if (ContainsAny(text, "acessibilidade", "cadeirante", "rampa", "guia rebaixada")) return "acessibilidade_comprometida";
        if (ContainsAny(text, "deslizamento", "desmoronamento", "encosta")) return "deslizamento_risco";

        return OccurrenceCategoryCatalog.DefaultCategory;
    }

    private static bool ContainsAny(string text, params string[] terms)
    {
        return terms.Any(term => text.Contains(term, StringComparison.OrdinalIgnoreCase));
    }
}
