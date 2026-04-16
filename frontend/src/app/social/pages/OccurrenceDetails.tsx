import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Heart, MapPin, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import occurrenceService, { OccurrenceComment, OccurrenceDetails as OccurrenceDetailsType } from "../../../services/OccurrenceService";
import { getOccurrenceCategoryLabel } from "../utils/occurrenceCategory";

const statusLabels = {
  pending: { label: "Pendente", color: "bg-amber-500" },
  resolved: { label: "Resolvida", color: "bg-emerald-600" },
  deleted: { label: "Excluida", color: "bg-zinc-500" },
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getInitials(name?: string): string {
  if (!name) return "US";
  const chunks = name.split(" ").filter(Boolean);
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0]}${chunks[chunks.length - 1][0]}`.toUpperCase();
}

export function OccurrenceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [occurrence, setOccurrence] = useState<OccurrenceDetailsType | null>(null);
  const [comments, setComments] = useState<Array<OccurrenceComment>>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionsLoading, setActionsLoading] = useState(false);

  const occurrenceId = id ? Number(id) : NaN;

  const loadOccurrence = async () => {
    if (!Number.isFinite(occurrenceId)) return;

    const [occurrenceData, commentsData] = await Promise.all([
      occurrenceService.getById(occurrenceId),
      occurrenceService.getComments(occurrenceId),
    ]);

    setOccurrence(occurrenceData);
    setComments(commentsData);
  };

  useEffect(() => {
    (async () => {
      if (!Number.isFinite(occurrenceId)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await loadOccurrence();
      } catch (error) {
        console.error(error);
        toast.error(getErrorMessage(error, "Nao foi possivel carregar a ocorrencia"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleLike = async () => {
    if (!occurrence) return;

    try {
      setActionsLoading(true);
      await occurrenceService.toggleLike(occurrence.id);
      await loadOccurrence();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Nao foi possivel curtir a ocorrencia"));
    } finally {
      setActionsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!occurrence) return;

    const shareData = {
      title: getOccurrenceCategoryLabel(occurrence.type),
      text: occurrence.description || "Ocorrencia no YourStreet",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para a area de transferencia");
      }
    } catch {
      // Ignore cancel from native share dialog.
    }
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!occurrence || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await occurrenceService.addComment(occurrence.id, commentText.trim());
      setCommentText("");
      await loadOccurrence();
      toast.success("Comentario adicionado");
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Nao foi possivel adicionar comentario"));
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Carregando ocorrencia...</p>
      </div>
    );
  }

  if (!occurrence) {
    return (
      <div className="h-[calc(100vh-3.5rem-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Ocorrencia nao encontrada</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto pb-6">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background z-10 border-b border-border px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>

        {occurrence.imageBase64 && (
          <div className="w-full aspect-video overflow-hidden">
            <img src={occurrence.imageBase64} alt={occurrence.type} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="mb-3">
            <span className={`${statusLabels[occurrence.status].color} text-white text-xs px-3 py-1 rounded-full inline-block`}>
              {statusLabels[occurrence.status].label}
            </span>
          </div>

          <h1 className="text-2xl font-semibold mb-3">{getOccurrenceCategoryLabel(occurrence.type)}</h1>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{occurrence.address || "Endereco nao informado"}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{formatDate(occurrence.createdAt)}</p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Descricao</h3>
            <p className="text-muted-foreground leading-relaxed">{occurrence.description || "Sem descricao informada."}</p>
          </div>

          <div className="flex items-center gap-6 py-4 border-y border-border mb-6">
            <button
              onClick={handleLike}
              disabled={actionsLoading}
              className={`flex items-center gap-2 hover:text-amber-600 transition-colors ${occurrence.likedByCurrentUser ? "text-amber-600" : ""}`}
            >
              <Heart className={`h-5 w-5 ${occurrence.likedByCurrentUser ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">{occurrence.likesCount}</span>
            </button>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 hover:text-primary transition-colors ml-auto"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">Compartilhar</span>
            </button>
          </div>

          <div className="mb-6 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Votacao de resolucao</p>
            <p className="text-sm mt-1">
              <strong>{occurrence.solvedVotes}</strong> disseram que solucionou e <strong>{occurrence.notSolvedVotes}</strong> disseram que nao solucionou.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-4">Comentarios ({comments.length})</h3>

            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-2">
                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary text-primary-foreground text-xs grid place-items-center font-semibold">
                  VC
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Adicione um comentario..."
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Nenhum comentario ainda. Seja o primeiro a comentar!
                </p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-muted text-sm grid place-items-center font-medium">
                          {getInitials(comment.user?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.user?.name || "Usuario"}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
