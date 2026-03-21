import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import occurrenceService, { OccurrenceType } from "../../../services/OccurrenceService";

interface AddressSuggestion {
  id: string;
  displayName: string;
  value: string;
}

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
  const [suggestions, setSuggestions] = useState<Array<AddressSuggestion>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingCurrentAddress, setLoadingCurrentAddress] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<number | null>(null);

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
      setSuggestions([]);
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel criar a ocorrencia");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const prefillCurrentAddress = async () => {
      if (!navigator.geolocation) {
        if (mounted) setLoadingCurrentAddress(false);
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        });

        const params = new URLSearchParams({
          format: "jsonv2",
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
          addressdetails: "1",
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
        if (!response.ok) {
          if (mounted) setLoadingCurrentAddress(false);
          return;
        }

        const data = (await response.json()) as {
          address?: {
            road?: string;
            house_number?: string;
          };
          display_name?: string;
        };

        if (!mounted) return;

        const road = data.address?.road?.trim() ?? "";
        const number = data.address?.house_number?.trim() ?? "";
        const shortAddress = [road, number].filter(Boolean).join(", ");

        if (shortAddress) {
          setLocation(shortAddress);
        } else if (data.display_name) {
          setLocation(data.display_name);
        }
      } catch {
        // Keep manual input when user denies permission or reverse lookup fails.
      } finally {
        if (mounted) setLoadingCurrentAddress(false);
      }
    };

    void prefillCurrentAddress();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    const query = location.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const params = new URLSearchParams({
          format: "jsonv2",
          limit: "5",
          countrycodes: "br",
          addressdetails: "1",
          q: query,
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as Array<{
          place_id: number;
          display_name: string;
          address?: {
            road?: string;
            house_number?: string;
          };
        }>;

        const nextSuggestions = data.map((item) => {
          const road = item.address?.road?.trim() ?? "";
          const number = item.address?.house_number?.trim() ?? "";
          const shortAddress = [road, number].filter(Boolean).join(", ");

          return {
            id: String(item.place_id),
            displayName: item.display_name,
            value: shortAddress || item.display_name,
          };
        });

        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [location]);

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
            {loadingCurrentAddress && (
              <p className="text-xs text-muted-foreground">Tentando preencher com sua localização atual...</p>
            )}
            {(loadingSuggestions || suggestions.length > 0) && (
              <div className="rounded-md border border-border bg-background shadow-sm overflow-hidden">
                {loadingSuggestions ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Buscando sugestões de endereço...</p>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => {
                        setLocation(suggestion.value);
                        setSuggestions([]);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      {suggestion.value}
                    </button>
                  ))
                )}
              </div>
            )}
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
