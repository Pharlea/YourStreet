import { useState } from "react";
import { Camera, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import occurrenceService, { OccurrenceType } from "../../../services/OccurrenceService";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });
}

export function CreateOccurrence() {
  const [type, setType] = useState<OccurrenceType>("buraco");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const base64 = await fileToBase64(files[0]);
      setImage(base64);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel processar a imagem");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!description || !location) {
      toast.error("Por favor, preencha todos os campos obrigatorios");
      return;
    }

    try {
      setSubmitting(true);
      await occurrenceService.create({
        type,
        description,
        address: location,
        imageBase64: image,
      });

      toast.success("Ocorrencia criada com sucesso!");
      setType("buraco");
      setDescription("");
      setLocation("");
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel criar a ocorrencia");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto pb-6">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Criar Ocorrencia</h2>
          <p className="text-muted-foreground text-sm">Reporte problemas que voce encontrou em sua rua</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo do Problema *</Label>
            <select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value as OccurrenceType)}
              className="w-full rounded-md bg-input-background border-0 px-3 py-2 text-sm"
              required
            >
              <option value="buraco">Buraco</option>
              <option value="alagamento">Alagamento</option>
              <option value="acidente">Acidente</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="bg-input-background border-0 min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localizacao *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="location"
                type="text"
                placeholder="Rua, bairro ou endereco"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="pl-10 bg-input-background border-0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fotos do Problema</Label>
            <div className="space-y-3">
              {image && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
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
                        <p className="text-xs text-muted-foreground">Tire ou selecione fotos do problema</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Send className="h-5 w-5" />
            {submitting ? "Enviando..." : "Enviar Ocorrencia"}
          </button>
        </form>
      </div>
    </div>
  );
}
