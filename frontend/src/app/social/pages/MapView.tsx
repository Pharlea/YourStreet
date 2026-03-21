import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Locate } from "lucide-react";
import { toast } from "sonner";
import occurrenceService, { OccurrenceSummary } from "../../../services/OccurrenceService";

const defaultCenter: [number, number] = [-23.5505, -46.6333];

const typeLabel: Record<string, string> = {
  buraco: "Buraco",
  alagamento: "Alagamento",
  acidente: "Acidente",
};

type OccurrenceOnMap = OccurrenceSummary & {
  coordinates: [number, number];
};

const NEARBY_RADIUS_KM = 16;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fallbackCoordinates(id: number, index: number): [number, number] {
  const ring = Math.floor(index / 10) + 1;
  const slot = index % 10;
  const angle = (slot / 10) * (Math.PI * 2);
  const radius = 0.002 * ring;

  const jitterLat = ((id % 23) - 11) * 0.0001;
  const jitterLng = ((id % 29) - 14) * 0.0001;

  return [
    defaultCenter[0] + Math.sin(angle) * radius + jitterLat,
    defaultCenter[1] + Math.cos(angle) * radius + jitterLng,
  ];
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function MapView() {
  const [occurrences, setOccurrences] = useState<Array<OccurrenceSummary>>([]);
  const [mapOccurrences, setMapOccurrences] = useState<Array<OccurrenceOnMap>>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingCoordinates, setResolvingCoordinates] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const currentLocationRef = useRef<L.Marker | null>(null);
  const geocodeCacheRef = useRef<Map<string, [number, number] | null>>(new Map());

  const filteredOccurrences = useMemo(() => {
    if (!userLocation) {
      return mapOccurrences;
    }

    return mapOccurrences.filter((occurrence) => {
      const [lat, lng] = occurrence.coordinates;
      return haversineDistanceKm(userLocation.lat, userLocation.lng, lat, lng) <= NEARBY_RADIUS_KM;
    });
  }, [mapOccurrences, userLocation]);

  const fetchCoordinates = async (address: string): Promise<[number, number] | null> => {
    const normalized = address.trim().toLowerCase();
    if (!normalized) return null;

    if (geocodeCacheRef.current.has(normalized)) {
      return geocodeCacheRef.current.get(normalized) ?? null;
    }

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        limit: "1",
        countrycodes: "br",
        q: address,
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        geocodeCacheRef.current.set(normalized, null);
        return null;
      }

      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (!Array.isArray(data) || data.length === 0) {
        geocodeCacheRef.current.set(normalized, null);
        return null;
      }

      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        geocodeCacheRef.current.set(normalized, null);
        return null;
      }

      const coords: [number, number] = [lat, lng];
      geocodeCacheRef.current.set(normalized, coords);
      return coords;
    } catch {
      geocodeCacheRef.current.set(normalized, null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        const data = await occurrenceService.list();
        if (!mounted) return;
        setOccurrences(data);
      } catch (error) {
        console.error(error);
        toast.error("Nao foi possivel carregar as ocorrencias");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const resolveAllCoordinates = async () => {
      if (occurrences.length === 0) {
        setMapOccurrences([]);
        return;
      }

      setResolvingCoordinates(true);

      const resolved: Array<OccurrenceOnMap> = [];

      for (let i = 0; i < occurrences.length; i += 1) {
        const occurrence = occurrences[i];
        const address = occurrence.address?.trim() ?? "";
        const coords = address ? await fetchCoordinates(address) : null;

        resolved.push({
          ...occurrence,
          coordinates: coords ?? fallbackCoordinates(occurrence.id, i),
        });
      }

      if (!mounted) return;
      setMapOccurrences(resolved);
      setResolvingCoordinates(false);
    };

    void resolveAllCoordinates();

    return () => {
      mounted = false;
    };
  }, [occurrences]);

  useEffect(() => {
    let mounted = true;

    const resolveUserLocation = async () => {
      if (!navigator.geolocation) return;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        });

        if (!mounted) return;

        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch {
        // Keep default behavior when location permission is not granted.
      }
    };

    void resolveUserLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      preferCanvas: true,
      zoomControl: true,
      inertia: true,
      doubleClickZoom: true,
    }).setView(defaultCenter, 12);

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      updateWhenIdle: true,
      keepBuffer: 4,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    const syncSize = () => map.invalidateSize({ pan: false, debounceMoveend: true });
    const timerA = window.setTimeout(syncSize, 0);
    const timerB = window.setTimeout(syncSize, 180);
    const timerC = window.setTimeout(syncSize, 600);

    const onResize = () => syncSize();
    window.addEventListener("resize", onResize);

    const observer = new ResizeObserver(() => syncSize());
    observer.observe(mapContainerRef.current);

    return () => {
      window.clearTimeout(timerA);
      window.clearTimeout(timerB);
      window.clearTimeout(timerC);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      currentLocationRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (filteredOccurrences.length === 0) return;

    const points: Array<L.LatLngExpression> = [];

    filteredOccurrences.forEach((occurrence) => {
      const [lat, lng] = occurrence.coordinates;
      const label = typeLabel[occurrence.type] || occurrence.type;
      const address = occurrence.address || "Endereco nao informado";
      const title = `Ocorrência de ${label}`;
      const description = occurrence.description || "Sem descrição informada.";
      const imageHtml = occurrence.imageBase64
        ? `<img src="${occurrence.imageBase64}" alt="Foto da ocorrência" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
        : "";

      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        color: "#7c5a00",
        weight: 2,
        fillColor: "#facc15",
        fillOpacity: 0.95,
      }).addTo(markersLayerRef.current!);

      marker.bindTooltip(`${label} - ${address}`, {
        direction: "top",
        offset: [0, -10],
        sticky: true,
        opacity: 0.95,
      });

      const popupHtml = `<div style="font-family:sans-serif;min-width:220px;max-width:260px;">${imageHtml}<p style="font-size:14px;font-weight:700;margin:0 0 6px 0;">${escapeHtml(title)}</p><p style="font-size:12px;color:#374151;margin:0 0 6px 0;">${escapeHtml(description)}</p><p style="font-size:12px;color:#6b7280;margin:0 0 10px 0;">${escapeHtml(address)}</p><a href="/ocorrencia/${occurrence.id}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:6px 10px;border-radius:8px;font-size:12px;">Abrir detalhes</a></div>`;
      marker.bindPopup(popupHtml, {
        closeButton: false,
      });

      marker.on("mouseover", () => marker.openTooltip());
      marker.on("mouseout", () => marker.closeTooltip());
      marker.on("click", () => marker.openPopup());

      points.push([lat, lng]);
    });

    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (points.length === 1) {
      mapRef.current.setView(points[0] as L.LatLngExpression, 15, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    mapRef.current.fitBounds(bounds, {
      maxZoom: 15,
      padding: [36, 36],
      animate: true,
    });
  }, [filteredOccurrences, userLocation]);

  const handleLocate = () => {
    if (!mapRef.current) return;

    mapRef.current.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
    });

    mapRef.current.once("locationfound", (event: L.LocationEvent) => {
      if (!mapRef.current) return;

      if (currentLocationRef.current) {
        currentLocationRef.current.remove();
      }

      currentLocationRef.current = L.marker(event.latlng)
        .addTo(mapRef.current)
        .bindPopup("Voce esta aqui")
        .openPopup();

      setUserLocation({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    });
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] relative isolate">
      <button
        onClick={handleLocate}
        className="absolute bottom-24 right-4 z-[1200] bg-white p-3 rounded-full shadow-lg hover:bg-accent transition-colors"
        aria-label="Centralizar na minha localizacao"
      >
        <Locate className="h-6 w-6 text-primary" />
      </button>

      <div ref={mapContainerRef} className="w-full h-full relative z-0" />

      {(loading || resolvingCoordinates) && (
        <div className="absolute inset-0 z-[1100] pointer-events-none grid place-items-center">
          <div className="bg-white/90 border border-border rounded-full px-4 py-2 shadow-md flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Carregando ocorrencias...</p>
          </div>
        </div>
      )}

      {!loading && !resolvingCoordinates && filteredOccurrences.length === 0 && (
        <div className="absolute inset-x-0 bottom-28 z-[1100] px-4 pointer-events-none">
          <div className="max-w-md mx-auto bg-white/95 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground text-center">
            {userLocation
              ? `Nenhuma ocorrência encontrada em um raio de ${NEARBY_RADIUS_KM} km da sua localização.`
              : "Nenhuma ocorrência encontrada para o filtro atual."}
          </div>
        </div>
      )}

    </div>
  );
}
