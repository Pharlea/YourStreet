# Estado da Ocorrencia - Arquitetura e Regras

Este documento descreve em detalhes como funciona o ciclo de vida de uma ocorrencia no YourStreet, incluindo criacao de prompts de validacao, votacao comunitaria, resolucao automatica e exclusao por inatividade.

## Objetivo

Garantir que ocorrencias nao fiquem permanentemente pendentes.

As ocorrencias podem mudar de estado para:
- `resolved`: quando houver evidencia comunitaria suficiente de que foi solucionada.
- `deleted`: quando nao houver interacao por mais de 30 dias.

## Estados da ocorrencia

Valores possiveis no campo `Occurrences.Status`:
- `pending`
- `resolved`
- `deleted`

Campos de suporte:
- `CreatedAt`: data de criacao da ocorrencia.
- `LastInteractionAt`: ultima interacao relevante para regra de inatividade.
- `StatusChangedAt`: data da ultima mudanca de estado.

## O que conta como interacao

Atualiza `LastInteractionAt`:
- criacao da ocorrencia
- like/unlike
- favorite/unfavorite
- comentario
- voto de resolucao

Isso reduz custo de consulta porque a regra de 30 dias nao precisa varrer comentarios/likes/favoritos para encontrar a ultima data.

## Regras de mudanca de estado

### 1) Resolucao automatica
A ocorrencia muda de `pending` para `resolved` quando:
- idade da ocorrencia >= 2 horas
- total de votos >= quorum minimo configurado
- votos `solucionou` > votos `nao solucionou`

Quorum minimo:
- configurado por `OCCURRENCE_RESOLUTION_MIN_VOTES`
- padrao: `3`

### 2) Exclusao por inatividade
A ocorrencia muda de `pending` para `deleted` quando:
- `now - LastInteractionAt > 30 dias`

## Votacao comunitaria

Tabela: `OccurrenceResolutionVotes`

Regras:
- apenas usuario que ja interagiu (comentou ou deu like) pode votar
- 1 voto por usuario por ocorrencia (upsert)
- voto pode ser alterado (atualiza `IsSolved`)
- operacao em transacao `Serializable` para maior consistencia concorrente

Endpoint:
- `POST /api/occurrences/{id}/resolution-vote`

Payload:
```json
{ "isSolved": true }
```

Resposta:
```json
{
  "status": "pending",
  "solvedVotes": 2,
  "notSolvedVotes": 1,
  "minVotesRequired": 3
}
```

## Prompts de validacao

Tabela: `OccurrenceResolutionPromptStates`

Campos-chave:
- `HasNearbyPrompted`: controla prompt por proximidade (primeira vez em 100m)
- `LastDayPrompted`: ultimo marco temporal disparado (7, 15, 30)
- `NextPromptAt`: proximo horario previsto de prompt temporal

### Gatilhos de prompt

Um usuario so recebe prompt para ocorrencia com a qual ele ja interagiu (comentario ou like) e que esteja `pending`.

Gatilhos:
- `nearby_first`: primeira vez em raio de 100m
- `day_7`
- `day_15`
- `day_30`

Endpoint:
- `GET /api/occurrences/resolution-prompts?userLat={lat}&userLng={lng}`

Resposta:
```json
[
  {
    "occurrenceId": 123,
    "type": "buraco",
    "description": "Buraco grande na esquina",
    "address": "Rua X, 100",
    "imageBase64": null,
    "createdAt": "2026-04-16T12:00:00Z",
    "status": "pending",
    "reasons": ["nearby_first", "day_7"]
  }
]
```

## Otimizacoes aplicadas

### 1) Job em background para ciclo de vida
Servico hospedado executa recalc periodico sem depender de request de usuario.

Classe:
- `OccurrenceLifecycleBackgroundService`

Intervalo:
- `OCCURRENCE_LIFECYCLE_INTERVAL_SECONDS`
- padrao: `300` segundos
- minimo aplicado: `30` segundos

### 2) Menos varredura para prompts
`NextPromptAt` permite selecionar candidatos temporais sem percorrer todas as ocorrencias do usuario.

### 3) Menor custo para regra de 30 dias
`LastInteractionAt` denormalizado elimina agregacoes repetidas em tabelas de interacao.

### 4) Maior consistencia em concorrencia
Votacao usa transacao serializable para reduzir risco de condicoes de corrida.

## Frontend - estrategia de popup

Componente:
- `OccurrenceResolutionPrompt.tsx`

Comportamento:
- consulta ao abrir
- nova consulta ao ganhar foco da janela
- nova consulta quando aba volta a ficar visivel
- cooldown local de 60s para evitar excesso de chamadas
- usa localizacao em cache quando disponivel
- tenta geolocalizacao pontual quando necessario

## Esquema de banco (novos campos/tabelas)

### Occurrences
- `LastInteractionAt` (timestamp with time zone, indexed)

### OccurrenceResolutionPromptStates
- `NextPromptAt` (timestamp with time zone, indexed)

### Ja existentes e usados por esta feature
- `Occurrences.Status`
- `Occurrences.StatusChangedAt`
- `OccurrenceResolutionVotes`
- `OccurrenceResolutionPromptStates`

## Configuracao

No `backend/.env` (opcional):

```env
OCCURRENCE_RESOLUTION_MIN_VOTES=3
OCCURRENCE_LIFECYCLE_INTERVAL_SECONDS=300
```

## Fluxo resumido

1. Usuario cria/interage em ocorrencia (`LastInteractionAt` atualizado).
2. Backend agenda prompts por `NextPromptAt` e proximidade 100m.
3. App mostra popup nos momentos definidos.
4. Usuario vota (transacional).
5. Job de ciclo de vida aplica regras de resolucao e inatividade periodicamente.
6. Listagens retornam estado atual (`pending`, `resolved`, `deleted`).

## Migracoes relacionadas

- `20260416231442_OccurrenceStatusLifecyclePrompts`
- `20260416232834_OccurrenceStatePerformanceAndReliability`

## Pontos de atencao operacionais

- geolocalizacao depende de permissao do navegador/dispositivo
- se API key de geocoding nao estiver configurada, prompts por proximidade podem reduzir efetividade
- em cargas altas, mantenha indice e intervalos de job adequados ao ambiente
