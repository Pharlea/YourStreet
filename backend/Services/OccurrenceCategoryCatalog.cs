namespace your_street_server.Services;

public record OccurrenceCategory(string Key, string Label);

public static class OccurrenceCategoryCatalog
{
    public static IReadOnlyList<OccurrenceCategory> All { get; } = new List<OccurrenceCategory>
    {
        new("buraco_via", "Buraco na Via"),
        new("pavimento_danificado", "Pavimento Danificado"),
        new("erosao_via", "Erosao da Via"),
        new("tampa_bueiro_danificada", "Tampa de Bueiro Danificada"),
        new("bueiro_entupido", "Bueiro Entupido"),
        new("alagamento", "Alagamento"),
        new("drenagem_insuficiente", "Drenagem Insuficiente"),
        new("vazamento_agua", "Vazamento de Agua"),
        new("falta_agua", "Falta de Agua"),
        new("esgoto_a_ceu_aberto", "Esgoto a Ceu Aberto"),
        new("semaforo_apagado", "Semaforo Apagado"),
        new("semaforo_danificado", "Semaforo Danificado"),
        new("sinalizacao_danificada", "Sinalizacao Danificada"),
        new("iluminacao_publica_apagada", "Iluminacao Publica Apagada"),
        new("poste_risco_queda", "Poste com Risco de Queda"),
        new("arvore_risco_queda", "Arvore com Risco de Queda"),
        new("lixo_acumulado", "Lixo Acumulado"),
        new("descarte_irregular", "Descarte Irregular"),
        new("acidente_transito", "Acidente de Transito"),
        new("animal_solto_via", "Animal Solto na Via"),
        new("obra_irregular", "Obra Irregular"),
        new("calcada_danificada", "Calcada Danificada"),
        new("acessibilidade_comprometida", "Acessibilidade Comprometida"),
        new("deslizamento_risco", "Risco de Deslizamento"),
        new("outros", "Outros")
    };

    public static readonly string DefaultCategory = "outros";

    public static readonly HashSet<string> AllowedKeys =
        All.Select(item => item.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);

    public static string ToLabel(string key)
    {
        var match = All.FirstOrDefault(item => string.Equals(item.Key, key, StringComparison.OrdinalIgnoreCase));
        return match?.Label ?? "Outros";
    }
}
