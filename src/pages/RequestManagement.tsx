import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { CheckCircle, Clock, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import {
  supportRequestsAPI,
  departmentsAPI,
  type RequestSummary,
  type RequestDetail,
  type Department,
} from '../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getRequestStatusLabel, getRequestStatusStyles, isRequestAnswered } from '../utils/requestStatus';
import { toast } from 'sonner';

export function RequestManagement() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdministrator);
  const [activeTab, setActiveTab] = useState('pending');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [stats, setStats] = useState<{ recibidas: number; contestadas: number }>({
    recibidas: 0,
    contestadas: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /** pending = recibidas; answered = contestadas */
  const statusMap: Record<string, string> = {
    pending: 'RECIBIDA',
  };

  const resolvedDepartmentId =
    departmentFilter === 'all' ? undefined : departmentFilter;

  const fetchStats = async () => {
    if (!isAdmin && !user?.id) return;
    try {
      const statsData = isAdmin
        ? await supportRequestsAPI.admin.getStats(resolvedDepartmentId)
        : await supportRequestsAPI.getStats(user!.id);
      const legacyAnswered =
        Number((statsData as { enProceso?: number }).enProceso || 0) +
        Number((statsData as { resueltas?: number }).resueltas || 0);
      setStats({
        recibidas: Number(statsData.recibidas || 0),
        contestadas: Number(statsData.contestadas ?? legacyAnswered ?? 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRequests = async () => {
    const status = activeTab === 'answered' ? 'CONTESTADA' : statusMap.pending;
    const data = isAdmin
      ? await supportRequestsAPI.admin.getAll(status, resolvedDepartmentId)
      : await supportRequestsAPI.getAll(undefined, status);
    const sorted = [...data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setRequests(sorted);
  };

  useEffect(() => {
    if (!isAdmin) return;
    departmentsAPI
      .getAll()
      .then(setDepartments)
      .catch(() => toast.error('Error al cargar departamentos'));
  }, [isAdmin]);

  /** Stats y lista deben ir juntos para que los contadores coincidan con lo que ves en cada pestaña. */
  useEffect(() => {
    if (!isAdmin && !user?.id) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        await fetchStats();
        await fetchRequests();
      } catch (error) {
        console.error('Error loading requests:', error);
        if (!cancelled) toast.error('Error al cargar las solicitudes');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, activeTab, isAdmin, departmentFilter]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRequests()]);
    } catch {
      toast.error('Error al cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequestDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const data = await supportRequestsAPI.getById(id);
      setSelectedRequest(data);
      setResponseText(data.responseText || '');
    } catch (error) {
      toast.error('Error al cargar los detalles');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleOpenDialog = (requestSummary: RequestSummary) => {
    fetchRequestDetail(requestSummary.id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
    setResponseText('');
  };

  const handleUpdateRequest = async () => {
    if (isAdmin || !selectedRequest || !user) return;
    
    if (!responseText.trim()) {
      toast.error('Escribe una respuesta antes de enviar.');
      return;
    }

    setIsUpdating(true);

    try {
      await supportRequestsAPI.respond(selectedRequest.id, {
        responseText: responseText.trim(),
      });
      
      toast.success('¡Respuesta enviada!');
      handleCloseDialog();
      fetchAllData();
    } catch (error) {
      toast.error('Error al actualizar la solicitud');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': return 'bg-red-500 hover:bg-red-600';
      case 'MEDIA': return 'bg-[#5454e9] hover:bg-[#4040d0]';
      case 'BAJA': return 'bg-[#f5f7fb] text-black';
      default: return '';
    }
  };

  const isFinalized = selectedRequest ? isRequestAnswered(selectedRequest.status) : false;

  const RequestCard = ({ request }: { request: RequestSummary }) => (
    <Card className="hover:shadow-md transition-shadow border-2 border-[#f5f7fb]">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium mb-1">{request.requesterName}</p>
              <div className="flex flex-wrap gap-2">
                {request.departmentName && (
                  <Badge variant="outline" className="border-[#5454e9]/30 text-[#5454e9]">
                    {request.departmentName}
                  </Badge>
                )}
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
              </div>
            </div>
            <span className={getRequestStatusStyles(request.status)}>
              {isRequestAnswered(request.status) && <CheckCircle className="h-3 w-3 shrink-0" />}
              {request.status === 'RECIBIDA' && <AlertCircle className="h-3 w-3 shrink-0" />}
              {getRequestStatusLabel(request.status)}
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold">{request.title}</p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Date(request.createdAt).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenDialog(request)}
              className="border-2 border-[#f5f7fb] hover:bg-[#5454e9]/5"
              data-testid="respond-btn"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {isAdmin || request.status !== 'RECIBIDA' ? 'Ver detalles' : 'Responder'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6" data-tour="requests-content">
      {/* Header */}
      <div>
        <h1>Gestión de Solicitudes de Apoyo</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? 'Consulta las solicitudes de todos los departamentos'
            : 'Revisa y responde a las solicitudes de apoyo de los profesores'}
        </p>
      </div>

      {isAdmin && (
        <div className="max-w-xs">
          <Label>Filtrar por departamento</Label>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="mt-1 border-2 border-[#f5f7fb]">
              <SelectValue placeholder="Todos los departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.recibidas}</p>
                <p className="text-sm text-muted-foreground">Recibidas</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.contestadas}</p>
                <p className="text-sm text-muted-foreground">Contestadas</p>
              </div>
              <Clock className="h-8 w-8 text-[#5454e9]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests by Status */}
      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Todas las Solicitudes</CardTitle>
          <CardDescription>Organizadas por estado</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[#5454e9]" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" data-testid="requests-tab-pending">
                  Recibidas ({stats.recibidas})
                </TabsTrigger>
                <TabsTrigger value="answered" data-testid="requests-tab-answered">
                  Contestadas ({stats.contestadas})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes recibidas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="answered" className="space-y-4 mt-4">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes contestadas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests.map(request => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Request Details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAdmin
                ? 'Detalles de solicitud'
                : isFinalized
                  ? 'Detalles de Solicitud (Contestada)'
                  : 'Gestionar Solicitud de Apoyo'}
            </DialogTitle>
            {selectedRequest && (
              <DialogDescription>
                De {selectedRequest.requesterName}
                {selectedRequest.departmentName && ` · ${selectedRequest.departmentName}`}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5454e9]" />
            </div>
          ) : selectedRequest ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridad</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedRequest.priority)}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Estado Actual</Label>
                  <div className="mt-1">
                    <span className={getRequestStatusStyles(selectedRequest.status)}>
                      {getRequestStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Asunto</Label>
                <p className="text-sm font-medium mt-1">{selectedRequest.title}</p>
              </div>

              <div>
                <Label>Descripción</Label>
                <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded border-2 border-[#f5f7fb] whitespace-pre-wrap">
                  {selectedRequest.description}
                </p>
              </div>

              <hr className="border-[#f5f7fb]" />

              {isFinalized || isAdmin ? (
                <div className="space-y-4">
                  {isFinalized && selectedRequest.responseText && (
                    <div>
                      <Label>Respuesta proporcionada</Label>
                      <div className="text-sm mt-1 p-3 bg-[#5454e9]/5 rounded border-2 border-[#5454e9]/20 whitespace-pre-wrap">
                        {selectedRequest.responseText}
                      </div>
                    </div>
                  )}
                  {isAdmin && !isFinalized && (
                    <p className="text-sm text-muted-foreground">
                      Esta solicitud está pendiente de respuesta por el jefe de departamento correspondiente.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={handleCloseDialog} variant="outline" className="border-2 border-[#f5f7fb]">
                      Cerrar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="response">
                      Tu respuesta <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="response"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Escribe la orientación o respuesta al docente…"
                      className="min-h-[150px] mt-1 border-2 border-[#f5f7fb]"
                      data-testid="response-textarea"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateRequest}
                      className="flex-1 bg-[#5454e9] hover:bg-[#4040d0]"
                      disabled={isUpdating}
                      data-testid="response-submit-btn"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : 'Enviar respuesta'}
                    </Button>
                    <Button 
                      onClick={handleCloseDialog} 
                      variant="outline"
                      className="border-2 border-[#f5f7fb]"
                      disabled={isUpdating}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">No se pudieron cargar los detalles</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
