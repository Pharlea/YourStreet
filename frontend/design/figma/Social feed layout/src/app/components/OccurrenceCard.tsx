import { Heart, MessageCircle, Share2, X, MapPin } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { useState } from 'react';

interface OccurrenceCardProps {
  title: string;
  description: string;
  location: string;
  date: string;
  images: string[];
  likes: number;
  comments: number;
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
  onClose,
}: OccurrenceCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-4 pb-4 pointer-events-none">
      <Card className="max-w-md mx-auto shadow-lg pointer-events-auto max-h-[70vh] overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Images */}
        {images.length > 0 && (
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                +{images.length - 1} fotos
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <CardContent className="p-4 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-3">{description}</p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
          <p className="text-xs text-muted-foreground">{date}</p>
        </CardContent>

        {/* Footer - Interactions */}
        <CardFooter className="p-4 pt-3 border-t border-border bg-white">
          <div className="flex items-center gap-6 w-full">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 hover:text-[var(--yellow-accent-dark)] transition-colors ${
                isLiked ? 'text-[var(--yellow-accent-dark)]' : ''
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{comments}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors ml-auto">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
