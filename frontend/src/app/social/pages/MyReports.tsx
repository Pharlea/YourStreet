import { useEffect, useState } from "react";
import { Heart, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Card, CardContent } from "../components/ui/card";
import occurrenceService, { OccurrenceSummary } from "../../../services/OccurrenceService";
import AuthService from "../../../services/AuthService";

const typeLabel: Record<string, string> = {
  buraco: "Buraco",
  alagamento: "Alagamento",
  acidente: "Acidente",
};

const statusLabels = {
  pending: { label: "Pendente", color: "bg-amber-500" },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function MyReports() {
  const [reports, setReports] = useState<Array<OccurrenceSummary>>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    const authService = AuthService.getInstance();
    const user = authService.getCurrentUser() || (await authService.checkCurrentUser());
    const allReports = await occurrenceService.list();
    const userId = user ? Number(user.id) : null;

    const userReports = allReports.filter((report) => (userId ? report.userId === userId : false));
    setReports(userReports);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        await loadReports();
      } catch (error) {
        console.error(error);
        toast.error(getErrorMessage(error, "Nao foi possivel carregar suas ocorrencias"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Deseja realmente excluir esta ocorrencia?")) {
      try {
        await occurrenceService.delete(id);
        setReports((prev) => prev.filter((report) => report.id !== id));
        toast.success("Ocorrencia excluida");
      } catch (error) {
        console.error(error);
        toast.error(getErrorMessage(error, "Nao foi possivel excluir a ocorrencia"));
      }
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto pb-6">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Minhas Ocorrencias</h2>
          <p className="text-muted-foreground text-sm">Acompanhe o status das ocorrencias reportadas</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando suas ocorrencias...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Voce ainda nao criou nenhuma ocorrencia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardContent className="p-0 [&:last-child]:pb-0">
                  <Link to={`/ocorrencia/${report.id}`} className="w-full text-left block">
                    <div className="flex gap-3 p-3">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {report.imageBase64 ? (
                          <img src={report.imageBase64} alt={report.type} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">Sem imagem</div>
                        )}
                        <div
                          className={`absolute top-1 right-1 ${statusLabels.pending.color} text-white text-xs px-2 py-0.5 rounded-full`}
                        >
                          {statusLabels.pending.label}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{typeLabel[report.type] || report.type}</h3>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDelete(report.id);
                            }}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                            aria-label="Excluir ocorrencia"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{report.address || "Endereco nao informado"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{formatDate(report.createdAt)}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {report.likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {report.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
