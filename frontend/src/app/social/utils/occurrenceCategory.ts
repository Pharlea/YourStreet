const categoryLabels: Record<string, string> = {
  buraco_via: "Buraco na Via",
  pavimento_danificado: "Pavimento Danificado",
  erosao_via: "Erosao da Via",
  tampa_bueiro_danificada: "Tampa de Bueiro Danificada",
  bueiro_entupido: "Bueiro Entupido",
  alagamento: "Alagamento",
  drenagem_insuficiente: "Drenagem Insuficiente",
  vazamento_agua: "Vazamento de Agua",
  falta_agua: "Falta de Agua",
  esgoto_a_ceu_aberto: "Esgoto a Ceu Aberto",
  semaforo_apagado: "Semaforo Apagado",
  semaforo_danificado: "Semaforo Danificado",
  sinalizacao_danificada: "Sinalizacao Danificada",
  iluminacao_publica_apagada: "Iluminacao Publica Apagada",
  poste_risco_queda: "Poste com Risco de Queda",
  arvore_risco_queda: "Arvore com Risco de Queda",
  lixo_acumulado: "Lixo Acumulado",
  descarte_irregular: "Descarte Irregular",
  acidente_transito: "Acidente de Transito",
  animal_solto_via: "Animal Solto na Via",
  obra_irregular: "Obra Irregular",
  calcada_danificada: "Calcada Danificada",
  acessibilidade_comprometida: "Acessibilidade Comprometida",
  deslizamento_risco: "Risco de Deslizamento",
  outros: "Outros",
};

function toTitleCase(input: string): string {
  return input
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

export function getOccurrenceCategoryLabel(category: string): string {
  const key = category.trim().toLowerCase();
  return categoryLabels[key] || toTitleCase(key || "outros");
}
