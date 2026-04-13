# YourStreet

## Nova funcionalidade: Marcar como resolvido

O sistema agora suporta um fluxo de resolução colaborativa de ocorrências:

- Um usuário pode enviar um pedido para marcar a ocorrência como "resolvida".
- Caso a ocorrência já esteja marcada como "concluída", o autor da ocorrência pode solicitar que ela seja marcada como "não concluída".
- O pedido inclui texto de resolução e pode enviar uma imagem como prova.
- Após o envio, o estado da ocorrência muda para "aguardando confirmação".

## Regras de validação de resoluções

1. Se todos os usuários que deram like na ocorrência confirmarem o pedido,
   a ocorrência é marcada como concluída imediatamente.
2. Se pelo menos 75% dos usuários que deram like confirmarem o pedido e ninguém
   recusar, ela é marcada como concluída após 1 semana desde a última interação com
   o pedido de conclusão.
3. Se pelo menos 50% dos likes rejeitarem o pedido, o pedido é automaticamente negado.
4. Se menos de 75% dos likes confirmarem ou pelo menos uma pessoa recusar, a ocorrência
   aguarda 1 mês sem nenhuma alteração (likes, comentários, favoritos ou pedido de conclusão)
   para então ser marcada como concluída, desde que o número de recusas não seja maior que
   o número de confirmações.
5. A ocorrência não pode ser marcada como concluída enquanto o número de recusas for maior
   que o número de confirmações.

## Busca e filtros

- A barra de pesquisa permite encontrar ocorrências pelo status.
- É possível buscar ocorrências marcadas como concluídas usando termos como
  "concluída", "concluida" ou "completed".
- As ocorrências que você publicou são exibidas no seu painel de relatórios e também
  podem ser consultadas pelo status.

## Exclusão automática

- Uma ocorrência marcada como concluída é automaticamente removida do banco de dados
  após 3 meses da data de conclusão.

## Reabertura de ocorrência concluída

- Uma ocorrência concluída pode receber um pedido de reabertura para ser marcada como
  não concluída.
- O autor da ocorrência pode reverter a conclusão sozinho, até 3 vezes.
- Outros usuários podem participar do mesmo processo de validação de reabertura.
