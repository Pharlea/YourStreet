import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Locate, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import occurrenceService, { OccurrenceSummary } from "../../../services/OccurrenceService";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const mapCenter: [number, number] = [-23.5505, -46.6333];

const typeLabel: Record<string, string> = {
  buraco: "Buraco",
  alagamento: "Alagamento",
  acidente: "Acidente",
};

function getOccurrenceCoordinates(id: number): [number, number] {
  const latOffset = ((id % 7) - 3) * 0.0035;
  const lngOffset = ((id % 9) - 4) * 0.0035;
  return [mapCenter[0] + latOffset, mapCenter[1] + lngOffset];
}

export function MapView() {
  const navigate = useNavigate();
  const [occurrences, setOccurrences] = useState<Array<OccurrenceSummary>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const invalidateMapSize = () => {
    mapRef.current?.invalidateSize({ pan: false, debounceMoveend: true });
  };

  const filteredOccurrences = occurrences.filter((occurrence) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const searchText = [occurrence.type, occurrence.description, occurrence.address].join(" ").toLowerCase();
    return searchText.includes(query);
  });

  const loadOccurrences = async () => {
    try {
      const data = await occurrenceService.list();
      setOccurrences(data);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel carregar as ocorrencias");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadOccurrences();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(mapCenter, 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    // Leaflet may initialize before layout settles; force size sync for reliable hit-testing.
    const initialSyncTimer = window.setTimeout(invalidateMapSize, 0);
    const secondSyncTimer = window.setTimeout(invalidateMapSize, 250);

    const handleResize = () => invalidateMapSize();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => invalidateMapSize());
    observer.observe(mapContainerRef.current);

    return () => {
      window.clearTimeout(initialSyncTimer);
      window.clearTimeout(secondSyncTimer);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredOccurrences.forEach((occurrence) => {
      const coords = getOccurrenceCoordinates(occurrence.id);
      const marker = L.marker(coords, { icon: yellowIcon }).addTo(markersLayerRef.current!);
      marker.bindPopup(
        `<div style="font-family:sans-serif;"><p style="font-weight:600;margin:0 0 4px 0;font-size:14px;">${typeLabel[occurrence.type] || occurrence.type}</p><p style="color:#6b7280;margin:0;font-size:12px;">${occurrence.address || "Endereco nao informado"}</p></div>`,
      );

      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());

      marker.on("click", () => {
        navigate(`/ocorrencia/${occurrence.id}`);
      });
    });
  }, [filteredOccurrences, navigate]);

  const handleLocate = () => {
    if (!mapRef.current) return;

    mapRef.current.locate({ setView: true, maxZoom: 16 });
    mapRef.current.once("locationfound", (event: L.LocationEvent) => {
      if (!mapRef.current) return;

      L.marker(event.latlng).addTo(mapRef.current).bindPopup("Voce esta aqui").openPopup();
    });
  };

  const handleSelectOccurrence = (occurrenceId: number) => {
    navigate(`/ocorrencia/${occurrenceId}`);
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] relative">
      <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none">
        <div className="relative max-w-md mx-auto pointer-events-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar rua, bairro ou cidade..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10 bg-white shadow-lg border-0"
          />
        </div>
      </div>

      <button
        onClick={handleLocate}
        className="absolute bottom-24 right-4 z-[400] bg-white p-3 rounded-full shadow-lg hover:bg-accent transition-colors pointer-events-auto"
        aria-label="Centralizar na minha localizacao"
      >
        <Locate className="h-6 w-6 text-primary" />
      </button>

      <div ref={mapContainerRef} className="w-full h-full" />

      {!loading && filteredOccurrences.length > 0 && (
        <div className="absolute left-3 right-3 bottom-24 z-[350] max-w-md mx-auto pointer-events-none">
          <div className="bg-white/95 rounded-xl shadow-lg border border-border p-2 max-h-40 overflow-y-auto space-y-1.5 pointer-events-auto">
            {filteredOccurrences.map((occurrence) => (
              <button
                key={occurrence.id}
                onClick={() => handleSelectOccurrence(occurrence.id)}
                className="w-full text-left rounded-lg px-3 py-2 transition-colors hover:bg-accent"
              >
                <p className="text-sm font-medium">{typeLabel[occurrence.type] || occurrence.type}</p>
                <p className="text-xs text-muted-foreground truncate">{occurrence.address || "Endereco nao informado"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-[300] bg-white/70 grid place-items-center">
          <p className="text-sm text-muted-foreground">Carregando ocorrencias...</p>
        </div>
      )}

      {!loading && filteredOccurrences.length === 0 && (
        <div className="absolute inset-x-0 bottom-28 z-[300] px-4">
          <div className="max-w-md mx-auto bg-white/95 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground text-center">
            Nenhuma ocorrencia encontrada para o filtro atual.
          </div>
        </div>
      )}

    </div>
  );
}
