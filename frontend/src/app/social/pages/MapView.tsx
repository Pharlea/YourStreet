import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Locate, Search } from "lucide-react";
import { OccurrenceCard } from "../components/OccurrenceCard";
import { Input } from "../components/ui/input";

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

interface Occurrence {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  images: string[];
  likes: number;
  comments: number;
  lat: number;
  lng: number;
}

const mockOccurrences: Occurrence[] = [
  // {
  //   id: 1,
  //   title: "Buraco gigante na rua principal",
  //   description: "Buraco enorme esta causando problemas para carros e motocicletas.",
  //   location: "Rua das Flores, Centro",
  //   date: "Ha 2 horas",
  //   images: ["https://images.unsplash.com/photo-1696692118953-df89e9f639c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
  //   likes: 42,
  //   comments: 15,
  //   lat: -23.5505,
  //   lng: -46.6333,
  // },
  // {
  //   id: 2,
  //   title: "Poste de iluminacao quebrado",
  //   description: "Poste quebrado deixando a rua escura a noite.",
  //   location: "Av. Principal, Jardim das Acacias",
  //   date: "Ha 5 horas",
  //   images: ["https://images.unsplash.com/photo-1590611698402-672fa0ecc59d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
  //   likes: 28,
  //   comments: 8,
  //   lat: -23.5555,
  //   lng: -46.6383,
  // },
  // {
  //   id: 3,
  //   title: "Acumulo de lixo na calcada",
  //   description: "Lixo acumulado ha dias na esquina.",
  //   location: "Rua do Comercio, Vila Nova",
  //   date: "Ha 8 horas",
  //   images: ["https://images.unsplash.com/photo-1580767114670-c778cc443675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"],
  //   likes: 67,
  //   comments: 23,
  //   lat: -23.5455,
  //   lng: -46.6283,
  // },
];

export function MapView() {
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-23.5505, -46.6333], 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mockOccurrences.forEach((occurrence) => {
      const marker = L.marker([occurrence.lat, occurrence.lng], { icon: yellowIcon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:sans-serif;"><p style="font-weight:600;margin:0 0 4px 0;font-size:14px;">${occurrence.title}</p><p style="color:#6b7280;margin:0;font-size:12px;">${occurrence.location}</p></div>`,
      );

      marker.on("click", () => {
        setSelectedOccurrence(occurrence);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleLocate = () => {
    if (!mapRef.current) return;

    mapRef.current.locate({ setView: true, maxZoom: 16 });
    mapRef.current.once("locationfound", (event: L.LocationEvent) => {
      if (!mapRef.current) return;

      L.marker(event.latlng).addTo(mapRef.current).bindPopup("Voce esta aqui").openPopup();
    });
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] relative">
      <div className="absolute top-4 left-4 right-4 z-[400]">
        <div className="relative max-w-md mx-auto">
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
        className="absolute bottom-24 right-4 z-[400] bg-white p-3 rounded-full shadow-lg hover:bg-accent transition-colors"
        aria-label="Centralizar na minha localizacao"
      >
        <Locate className="h-6 w-6 text-primary" />
      </button>

      <div ref={mapContainerRef} className="w-full h-full" />

      {selectedOccurrence && (
        <OccurrenceCard
          title={selectedOccurrence.title}
          description={selectedOccurrence.description}
          location={selectedOccurrence.location}
          date={selectedOccurrence.date}
          images={selectedOccurrence.images}
          likes={selectedOccurrence.likes}
          comments={selectedOccurrence.comments}
          onClose={() => setSelectedOccurrence(null)}
        />
      )}
    </div>
  );
}
