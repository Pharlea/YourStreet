import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import occurrenceService, { ResolutionPrompt } from "../../../services/OccurrenceService";
import { getOccurrenceCategoryLabel } from "../utils/occurrenceCategory";

function getReasonLabel(reason: string): string {
  if (reason === "nearby_first") return "Voce passou perto dessa ocorrencia (raio de 100m).";
  if (reason === "day_7") return "A ocorrencia completou 7 dias.";
  if (reason === "day_15") return "A ocorrencia completou 15 dias.";
  if (reason === "day_30") return "A ocorrencia completou 30 dias.";
  return "Atualizacao de status pendente.";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function OccurrenceResolutionPrompt() {
  const [queue, setQueue] = useState<Array<ResolutionPrompt>>([]);
  const [loadingVote, setLoadingVote] = useState(false);

  const mountedRef = useRef(true);
  const pollingRef = useRef(false);
  const lastPollAtRef = useRef(0);

  const PROMPT_POLL_COOLDOWN_MS = 60000;
  const LAST_LOCATION_STORAGE_KEY = "yourstreet.last-user-location";

  const currentPrompt = queue[0] ?? null;

  const reasonText = useMemo(() => {
    if (!currentPrompt) return "";
    return currentPrompt.reasons.map(getReasonLabel).join(" ");
  }, [currentPrompt]);

  const getCachedLocation = (): { lat: number; lng: number } | null => {
    try {
      const raw = window.localStorage.getItem(LAST_LOCATION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return { lat: parsed.lat, lng: parsed.lng };
      }
      return null;
    } catch {
      return null;
    }
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    const cached = getCachedLocation();
    if (cached) return cached;

    if (!navigator.geolocation) {
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        });
      });

      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      try {
        window.localStorage.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures.
      }
      return next;
    } catch {
      return null;
    }
  };

  const pollPrompts = async (location: { lat: number; lng: number } | null, force = false) => {
    if (pollingRef.current) return;
    if (!force && Date.now() - lastPollAtRef.current < PROMPT_POLL_COOLDOWN_MS) return;

    pollingRef.current = true;
    lastPollAtRef.current = Date.now();

    try {
      const prompts = await occurrenceService.getResolutionPrompts(location);
      if (!mountedRef.current || prompts.length === 0) return;

      setQueue((prev) => {
        const existingIds = new Set(prev.map((item) => item.occurrenceId));
        const fresh = prompts.filter((item) => !existingIds.has(item.occurrenceId));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh];
      });
    } catch {
      // Keep silent to avoid noisy polling errors.
    } finally {
      pollingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const runPoll = async (force = false) => {
      const location = await getCurrentLocation();
      await pollPrompts(location, force);
    };

    void runPoll(true);

    const onFocus = () => {
      void runPoll(false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runPoll(false);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const removeCurrentPrompt = () => {
    setQueue((prev) => prev.slice(1));
  };

  const handleVote = async (isSolved: boolean) => {
    if (!currentPrompt) return;

    try {
      setLoadingVote(true);
      const result = await occurrenceService.voteResolution(currentPrompt.occurrenceId, isSolved);
      if (result.status === "resolved") {
        toast.success("Ocorrencia marcada como resolvida pela comunidade.");
      } else {
        toast.success("Seu voto foi registrado.");
      }
      removeCurrentPrompt();
    } catch (error) {
      toast.error(getErrorMessage(error, "Nao foi possivel registrar o voto."));
    } finally {
      setLoadingVote(false);
    }
  };

  if (!currentPrompt) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 px-4 grid place-items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Validacao comunitaria</p>
          <h3 className="text-lg font-semibold mt-1">Essa ocorrencia foi solucionada?</h3>
          <p className="text-sm text-muted-foreground mt-2">{getOccurrenceCategoryLabel(currentPrompt.type)}</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-foreground">{currentPrompt.description || "Sem descricao."}</p>
          <p className="text-xs text-muted-foreground">{currentPrompt.address || "Endereco nao informado"}</p>
          <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground flex gap-2">
            <Clock3 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{reasonText}</span>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-1 gap-2">
          <button
            onClick={() => void handleVote(true)}
            disabled={loadingVote}
            className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sim, foi solucionada
          </button>

          <button
            onClick={() => void handleVote(false)}
            disabled={loadingVote}
            className="w-full py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Nao, ainda persiste
          </button>

          <button
            onClick={removeCurrentPrompt}
            disabled={loadingVote}
            className="w-full py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
}
