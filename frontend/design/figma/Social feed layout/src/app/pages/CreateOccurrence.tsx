import { useState } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export function CreateOccurrence() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Simulate image upload - in a real app, you'd upload to a server
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages([...images, ...newImages]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !location) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Simulate submission
    toast.success('Ocorrência criada com sucesso!');
    
    // Reset form
    setTitle('');
    setDescription('');
    setLocation('');
    setImages([]);
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto pb-6">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Criar Ocorrência</h2>
          <p className="text-muted-foreground text-sm">
            Reporte problemas que você encontrou em sua rua
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Problema *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Ex: Buraco na rua principal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input-background border-0"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-input-background border-0 min-h-[120px]"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Localização *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="location"
                type="text"
                placeholder="Rua, bairro ou endereço"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 bg-input-background border-0"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Fotos do Problema</Label>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <label htmlFor="image-upload">
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      <div className="p-3 bg-muted rounded-full">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Adicionar Fotos</p>
                        <p className="text-xs text-muted-foreground">
                          Tire ou selecione fotos do problema
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Send className="h-5 w-5" />
            Enviar Ocorrência
          </button>
        </form>
      </div>
    </div>
  );
}
