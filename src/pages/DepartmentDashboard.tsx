import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, MessageSquare, TrendingUp, AlertCircle, BarChart3, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  analyticsAPI,
  supportRequestsAPI,
  type DepartmentDashboardDTO,
  type TopicDTO,
  type RequestSummary,
} from '../services/api';

export function DepartmentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DepartmentDashboardDTO | null>(null);
  const [topics, setTopics] = useState<TopicDTO[]>([]);
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = Boolean(user?.isAdministrator);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const pendingRequestsPromise = isAdmin
      ? supportRequestsAPI.admin.getAll('RECIBIDA')
      : supportRequestsAPI.getAll(undefined, 'RECIBIDA');

    Promise.all([
      analyticsAPI.getDashboard('WEEK'),
      analyticsAPI.getTopics('MONTH', 5),
      pendingRequestsPromise,
    ])
      .then(([dash, top, reqs]) => {
        setDashboard(dash);
        setTopics(top);
        setRequests(reqs);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const pendingRequests = requests.filter(
    (r) => r.status === 'RECIBIDA' || r.status === 'EN_PROCESO',
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1>{isAdmin ? 'Panorama institucional' : 'Panorama del Departamento'}</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? 'Resumen de actividad, solicitudes y uso de MAIA en todos los departamentos'
            : 'Monitorea el progreso de integración de IA y apoya a tu equipo docente'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="dept-dashboard-stats">
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5454e9]/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#5454e9]" />
              </div>
              <div>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.departmentUsers ?? dashboard?.activeUsers ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Total de usuarios' : 'Usuarios del departamento'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">
                    {dashboard?.requestsRecibidas ?? pendingRequests.length}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Solicitudes Pendientes</p>
                {!loading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contestadas: {dashboard?.requestsResueltas ?? 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.chatInteractions ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Sesiones de chat</p>
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.totalUsers ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Profesores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 border-2 border-[#f5f7fb] hover:bg-[#5454e9]/5"
              onClick={() => navigate('/requests')}
            >
              <MessageSquare className="h-8 w-8 text-[#5454e9]" />
              <div className="text-center">
                <p>Gestionar Solicitudes</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingRequests.length} pendientes</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2 border-2 border-[#f5f7fb] hover:bg-[#5454e9]/5"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-8 w-8 text-[#5454e9]" />
              <div className="text-center">
                <p>Ver Analítica</p>
                <p className="text-xs text-muted-foreground mt-1">Perspectivas detalladas</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <Card className="border-2 border-[#f5f7fb]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Solicitudes de Apoyo Pendientes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/requests')}
                className="text-[#5454e9] hover:text-[#4040d0] hover:bg-[#5454e9]/5"
              >
                Ver Todas
              </Button>
            </div>
            <CardDescription>Solicitudes que requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>¡Todo al día!</p>
                <p className="text-sm mt-1">No hay solicitudes pendientes</p>
              </div>
            ) : (
              pendingRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="p-4 border-2 border-[#f5f7fb] rounded-lg hover:bg-[#f5f7fb] transition-colors cursor-pointer"
                  onClick={() => navigate('/requests')}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="mb-1">{request.requesterName}</p>
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {request.departmentName && (
                          <Badge variant="outline" className="border-[#5454e9]/30 text-[#5454e9]">
                            {request.departmentName}
                          </Badge>
                        )}
                        <Badge className={
                          request.priority === 'ALTA' ? 'bg-red-500 hover:bg-red-600' :
                            request.priority === 'MEDIA' ? 'bg-[#5454e9] hover:bg-[#4040d0]' :
                              'bg-[#f5f7fb] text-black'
                        }>
                          Prioridad {request.priority === 'ALTA' ? 'Alta' : request.priority === 'MEDIA' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(request.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Topics */}
        <Card className="border-2 border-[#f5f7fb]">
          <CardHeader>
            <CardTitle>Temas Más Discutidos</CardTitle>
            <CardDescription>Lo que los profesores están consultando</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin consultas registradas este mes.
              </p>
            ) : (
              topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm capitalize">{topic.topic}</p>
                      <span className="text-sm text-muted-foreground">{topic.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5454e9] rounded-full"
                        style={{ width: `${(topic.count / topics[0].count) * 100}%` }}
                      />
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
