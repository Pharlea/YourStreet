import { useState } from "react";
import { Bookmark, Heart, MapPin, MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";

interface OccurrenceCommentItem {
  id: number;
  text: string;
  createdAt: string;
  userName?: string;
}

interface OccurrenceCardProps {
  title: string;
  description: string;
  location: string;
  date: string;
  images: string[];
  likes: number;
  comments: number;
  favorites: number;
  likedByCurrentUser: boolean;
  favoritedByCurrentUser: boolean;
  commentItems: Array<OccurrenceCommentItem>;
  commentsLoading: boolean;
  actionsLoading: boolean;
  onToggleLike: () => Promise<void>;
  onToggleFavorite: () => Promise<void>;
  onAddComment: (text: string) => Promise<void>;
  onClose: () => void;
}

export function OccurrenceCard({
  title,
  description,
  location,
  date,
  images,
  likes,
  comments,
  favorites,
  likedByCurrentUser,
  favoritedByCurrentUser,
  commentItems,
  commentsLoading,
  actionsLoading,
  onToggleLike,
  onToggleFavorite,
  onAddComment,
  onClose,
}: OccurrenceCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await onAddComment(commentText.trim());
      setCommentText("");
      setShowComments(true);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-4 pb-4 pointer-events-none">
      <Card className="max-w-md mx-auto shadow-lg pointer-events-auto max-h-[70vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {images.length > 0 && (
          <div className="relative w-full aspect-video overflow-hidden">
            <img src={images[0]} alt={title} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                +{images.length - 1} fotos
              </div>
            )}
          </div>
        )}

        <CardContent className="p-4 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-3">{description}</p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
          <p className="text-xs text-muted-foreground">{date}</p>
        </CardContent>

        <CardFooter className="p-4 pt-3 border-t border-border bg-white">
          <div className="flex items-center gap-4 w-full mb-3">
            <button
              onClick={onToggleLike}
              disabled={actionsLoading}
              className={`flex items-center gap-2 hover:text-amber-600 transition-colors ${likedByCurrentUser ? "text-amber-600" : ""}`}
            >
              <Heart className={`h-5 w-5 ${likedByCurrentUser ? "fill-current" : ""}`} />
              <span className="text-sm">{likes}</span>
            </button>
            <button
              onClick={() => setShowComments((prev) => !prev)}
              className={`flex items-center gap-2 hover:text-primary transition-colors ${showComments ? "text-primary" : ""}`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{comments}</span>
            </button>
            <button
              onClick={onToggleFavorite}
              disabled={actionsLoading}
              className={`flex items-center gap-2 hover:text-primary transition-colors ml-auto ${favoritedByCurrentUser ? "text-primary" : ""}`}
            >
              <Bookmark className={`h-5 w-5 ${favoritedByCurrentUser ? "fill-current" : ""}`} />
              <span className="text-sm">{favorites}</span>
            </button>
          </div>

          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Comente nesta ocorrencia"
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submittingComment || actionsLoading || !commentText.trim()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              Enviar
            </button>
          </form>

          {showComments && (
            <div className="mt-3 max-h-36 overflow-y-auto space-y-2">
              {commentsLoading ? (
                <p className="text-xs text-muted-foreground">Carregando comentarios...</p>
              ) : commentItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem comentarios ainda.</p>
              ) : (
                commentItems.map((comment) => (
                  <div key={comment.id} className="rounded-md bg-muted/40 px-2 py-1.5">
                    <p className="text-xs font-medium">{comment.userName || "Usuario"}</p>
                    <p className="text-xs">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
