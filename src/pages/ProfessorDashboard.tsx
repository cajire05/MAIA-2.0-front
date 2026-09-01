import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  BookOpen,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { resourcesAPI, supportRequestsAPI, type MyRequestSummary } from "../services/api";
import { getRequestStatusLabel, getRequestStatusStyles } from "../utils/requestStatus";
import {
  pickRecentLibraryResources,
  type DashboardResource,
} from "../utils/recentResources";
import {
  getAiasLevelLabel,
  getActivityTypeLabel,
  getExperienceLevelLabel,
  getCategoryLabel,
  getResourceTypeLabel,
} from "../utils/resourceLabels";

export function ProfessorDashboard() {
  const { user } = useAuth();
  const { openChat } = useChat();
  const navigate = useNavigate();

  const [resourcesCount, setResourcesCount] = useState<number>(0);
  const [recentResources, setRecentResources] = useState<DashboardResource[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequestSummary[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourcesAPI.getAll();
        const items = Array.isArray(data) ? data : (data as any)?.content || (data as any)?.items || [];
        setResourcesCount(items.length);
        setRecentResources(pickRecentLibraryResources(items, 3));
      } catch (err) {
        console.error("Error loading resources", err);
        setRecentResources([]);
      }
    };
    fetchResources();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchMyRequests = async () => {
      try {
        const data = await supportRequestsAPI.getMyRequests(user.id);
        setMyRequests(data);
      } catch (err) {
        console.error("Error loading support requests", err);
        setMyRequests([]);
      }
    };
    fetchMyRequests();
  }, [user?.id]);

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "ALTA":
        return "Alta";
      case "MEDIA":
        return "Media";
      case "BAJA":
        return "Baja";
      default:
        return priority;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div data-testid="dashboard-greeting">
        <h1 className="text-[28px]">Bienvenido, {user?.name?.split(" ")[0]}</h1>
        <p className="text-[#757575] mt-1">
          Continúa mejorando tu enseñanza con recursos y apoyo impulsados por IA
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5454e9]/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#5454e9]" />
              </div>
              <div>
                <p className="text-2xl">{resourcesCount}</p>
                <p className="text-sm text-[#757575]">
                  Total Recursos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5454e9]/10 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-[#5454e9]" />
              </div>
              <div>
                <p className="text-2xl">{myRequests.length}</p>
                <p className="text-sm text-[#757575]">
                  Solicitudes de Apoyo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5454e9]/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#5454e9]" />
              </div>
              <div>
                <p className="text-2xl">
                  {user?.experienceLevel === "beginner"
                    ? "Principiante"
                    : user?.experienceLevel === "intermediate"
                      ? "Intermedio"
                      : "Avanzado"}
                </p>
                <p className="text-sm text-[#757575]">
                  Experiencia con IA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede a tus tareas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent data-tour="dashboard-quick-actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 border-2 border-[#f5f7fb] hover:bg-[#5454e9]/5"
              onClick={openChat}
            >
              <MessageCircle className="h-8 w-8 text-[#5454e9]" />
              <div className="text-center">
                <p>Iniciar Chat IA</p>
                <p className="text-xs text-[#757575] mt-1">
                  Obtener orientación instantánea
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 border-2 border-[#f5f7fb] hover:bg-[#5454e9]/5"
              onClick={() => navigate("/library")}
            >
              <BookOpen className="h-8 w-8 text-[#5454e9]" />
              <div className="text-center">
                <p>Explorar Biblioteca</p>
                <p className="text-xs text-[#757575] mt-1">
                  Descubrir recursos
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 border-2 border-[#f5f7fb] hover:bg-[#5454e9]/5"
              onClick={() => navigate("/support")}
            >
              <HelpCircle className="h-8 w-8 text-[#5454e9]" />
              <div className="text-center">
                <p>Solicitar Apoyo</p>
                <p className="text-xs text-[#757575] mt-1">
                  Obtener ayuda experta
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Resources */}
        <Card className="border-2 border-[#f5f7fb]" data-testid="recent-resources-section">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recursos Agregados Recientemente</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/library")}
                className="text-[#5454e9] hover:text-[#4040d0] hover:bg-[#5454e9]/5"
              >
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResources.length === 0 ? (
              <div className="text-center py-8 text-[#757575]">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay recursos en la biblioteca aún</p>
              </div>
            ) : (
              recentResources.map((resource) => (
              <div
                key={resource.id}
                className="p-4 border-2 border-[#f5f7fb] rounded-lg hover:bg-[#f5f7fb] transition-colors cursor-pointer"
                onClick={() => navigate("/library")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="mb-1">{resource.title}</h4>
                    <p className="text-sm text-[#757575] mb-2">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getAiasLevelLabel(resource.aiasLevel) && (
                        <Badge variant="secondary" className="bg-[#f5f7fb] text-foreground text-xs">
                          {getAiasLevelLabel(resource.aiasLevel)}
                        </Badge>
                      )}
                      {getActivityTypeLabel(resource.activityType) && (
                        <Badge variant="outline" className="border-[#f5f7fb]">
                          {getActivityTypeLabel(resource.activityType)}
                        </Badge>
                      )}
                      {resource.category && (
                        <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">
                          {getCategoryLabel(resource.category)}
                        </Badge>
                      )}
                      {!getAiasLevelLabel(resource.aiasLevel) &&
                        !getActivityTypeLabel(resource.activityType) &&
                        !resource.category && (
                          <>
                            <Badge variant="outline" className="border-[#f5f7fb]">
                              {getResourceTypeLabel(resource.type)}
                            </Badge>
                            <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">
                              {getExperienceLevelLabel(resource.level)}
                            </Badge>
                          </>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Support Requests Status */}
        <Card className="border-2 border-[#f5f7fb]" data-testid="my-requests-section">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tus Solicitudes de Apoyo</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/support")}
                className="text-[#5454e9] hover:text-[#4040d0] hover:bg-[#5454e9]/5"
              >
                Nueva Solicitud
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-8 text-[#757575]">
                <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tienes solicitudes de apoyo aún</p>
                <p className="text-sm mt-1">
                  Envía una solicitud cuando necesites ayuda
                </p>
              </div>
            ) : (
              myRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="p-4 border-2 border-[#f5f7fb] rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={getRequestStatusStyles(request.status)}>
                          {request.status !== "RECIBIDA" && (
                            <CheckCircle className="h-3 w-3 shrink-0" />
                          )}
                          {getRequestStatusLabel(request.status)}
                        </span>
                        <Badge variant="outline" className="border-[#f5f7fb]">
                          Prioridad {getPriorityLabel(request.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{request.title}</p>
                      <p className="text-xs text-[#757575] mt-1">
                        {new Date(request.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}