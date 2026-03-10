import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Heart, MessageCircle, Share2, Send, MapPin } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

interface Occurrence {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  status: 'pending' | 'in_progress' | 'resolved';
  images: string[];
  likes: number;
  comments: Comment[];
}

// Mock data - em produção viria de uma API
const mockOccurrences: Record<number, Occurrence> = {
  1: {
    id: 1,
    title: 'Buraco gigante na rua principal',
    description: 'Buraco enorme está causando problemas para carros e motocicletas. Já vi vários acidentes acontecendo por aqui. O problema se agravou após as últimas chuvas e está piorando a cada dia. É urgente que a prefeitura tome uma atitude.',
    location: 'Rua das Flores, Centro',
    date: '05/03/2026',
    status: 'pending',
    images: [
      'https://images.unsplash.com/photo-1696692118953-df89e9f639c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ],
    likes: 42,
    comments: [
      {
        id: 1,
        author: 'Maria Silva',
        avatar: 'MS',
        text: 'Concordo! Esse buraco é muito perigoso, quase bati meu carro ontem.',
        date: 'Há 1 hora',
      },
      {
        id: 2,
        author: 'João Santos',
        avatar: 'JS',
        text: 'Já liguei na prefeitura mas não deram retorno ainda.',
        date: 'Há 3 horas',
      },
    ],
  },
  2: {
    id: 2,
    title: 'Poste de iluminação quebrado',
    description: 'Poste está quebrado desde a semana passada e a rua fica completamente escura à noite. Isso aumenta a insegurança na região e já houve relatos de assaltos.',
    location: 'Av. Principal, Jardim',
    date: '04/03/2026',
    status: 'in_progress',
    images: [
      'https://images.unsplash.com/photo-1590611698402-672fa0ecc59d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ],
    likes: 28,
    comments: [
      {
        id: 1,
        author: 'Ana Costa',
        avatar: 'AC',
        text: 'A prefeitura já foi notificada e está analisando o caso.',
        date: 'Há 2 horas',
      },
    ],
  },
  3: {
    id: 3,
    title: 'Lixo acumulado na esquina',
    description: 'Lixo acumulado há dias na esquina. Mau cheiro e risco de doenças. A coleta não passa há mais de uma semana.',
    location: 'Rua do Comércio, Vila Nova',
    date: '02/03/2026',
    status: 'resolved',
    images: [
      'https://images.unsplash.com/photo-1580767114670-c778cc443675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ],
    likes: 67,
    comments: [
      {
        id: 1,
        author: 'Pedro Oliveira',
        avatar: 'PO',
        text: 'Ótima notícia! O lixo foi coletado hoje pela manhã.',
        date: 'Há 5 horas',
      },
    ],
  },
};

const statusLabels = {
  pending: { label: 'Pendente', color: 'bg-[var(--yellow-accent)]' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500' },
  resolved: { label: 'Resolvido', color: 'bg-green-500' },
};

export function OccurrenceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');

  const occurrence = id ? mockOccurrences[parseInt(id)] : null;
  const [likes, setLikes] = useState(occurrence?.likes || 0);
  const [comments, setComments] = useState<Comment[]>(occurrence?.comments || []);

  if (!occurrence) {
    return (
      <div className="h-[calc(100vh-3.5rem-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Ocorrência não encontrada</p>
      </div>
    );
  }

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: occurrence.title,
        text: occurrence.description,
        url: window.location.href,
      });
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: comments.length + 1,
      author: 'Você',
      avatar: 'VC',
      text: commentText,
      date: 'Agora',
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto pb-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b border-border px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>

        {/* Images */}
        {occurrence.images.length > 0 && (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={occurrence.images[0]}
              alt={occurrence.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="px-4 pt-4">
          {/* Status Badge */}
          <div className="mb-3">
            <span
              className={`${statusLabels[occurrence.status].color} text-white text-xs px-3 py-1 rounded-full inline-block`}
            >
              {statusLabels[occurrence.status].label}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold mb-3">{occurrence.title}</h1>

          {/* Location and Date */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{occurrence.location}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{occurrence.date}</p>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground leading-relaxed">
              {occurrence.description}
            </p>
          </div>

          {/* Interaction Buttons */}
          <div className="flex items-center gap-6 py-4 border-y border-border mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 hover:text-[var(--yellow-accent-dark)] transition-colors ${
                isLiked ? 'text-[var(--yellow-accent-dark)]' : ''
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likes}</span>
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

          {/* Comments Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">
              Comentários ({comments.length})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-2">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    VC
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Adicione um comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-muted text-sm">
                            {comment.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {comment.author}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {comment.date}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {comment.text}
                          </p>
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
