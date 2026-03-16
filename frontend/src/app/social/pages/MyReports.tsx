import { useState } from "react";
import { Heart, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent } from "../components/ui/card";

interface Report {
  id: number;
  title: string;
  location: string;
  date: string;
  status: "pending" | "in_progress" | "resolved";
  image: string;
  likes: number;
  comments: number;
}

const mockReports: Report[] = [
  {
    id: 1,
    title: "Buraco gigante na rua principal",
    location: "Rua das Flores, Centro",
    date: "05/03/2026",
    status: "pending",
    image: "https://images.unsplash.com/photo-1696692118953-df89e9f639c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    likes: 42,
    comments: 15,
  },
  {
    id: 2,
    title: "Poste de iluminacao quebrado",
    location: "Av. Principal, Jardim",
    date: "04/03/2026",
    status: "in_progress",
    image: "https://images.unsplash.com/photo-1590611698402-672fa0ecc59d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    likes: 28,
    comments: 8,
  },
];

const statusLabels = {
  pending: { label: "Pendente", color: "bg-amber-500" },
  in_progress: { label: "Em andamento", color: "bg-blue-500" },
  resolved: { label: "Resolvido", color: "bg-green-500" },
};

export function MyReports() {
  const [reports, setReports] = useState(mockReports);

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir esta ocorrencia?")) {
      setReports((prev) => prev.filter((report) => report.id !== id));
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem-4rem)] overflow-y-auto pb-6">
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Minhas Ocorrencias</h2>
          <p className="text-muted-foreground text-sm">Acompanhe o status das ocorrencias reportadas</p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Voce ainda nao criou nenhuma ocorrencia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <Link to={`/ocorrencia/${report.id}`} className="block">
                    <div className="flex gap-3 p-3">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={report.image} alt={report.title} className="w-full h-full object-cover" />
                        <div
                          className={`absolute top-1 right-1 ${statusLabels[report.status].color} text-white text-xs px-2 py-0.5 rounded-full`}
                        >
                          {statusLabels[report.status].label}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{report.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{report.location}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{report.date}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {report.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {report.comments}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          handleDelete(report.id);
                        }}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors self-start"
                        aria-label="Excluir ocorrencia"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
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
