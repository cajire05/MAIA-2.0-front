import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { RequestDetailDialog } from '../components/RequestDetailDialog';
import { CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { supportRequestsAPI, type MyRequestSummary } from '../services/api';
import { getRequestStatusLabel, getRequestStatusStyles, isRequestAnswered } from '../utils/requestStatus';
import { toast } from 'sonner';

export function SupportRequest() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  
  const [requests, setRequests] = useState<MyRequestSummary[]>([]);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openRequestDetail = (id: string) => {
    setDetailRequestId(id);
    setDetailDialogOpen(true);
  };

  const fetchMyRequests = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await supportRequestsAPI.getMyRequests(user.id);
      setRequests(data);
    } catch (error) {
      toast.error('Error al cargar tus solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user?.id]);

  const requestIdParam = searchParams.get('requestId');

  useEffect(() => {
    if (!requestIdParam || !user?.id) return;
    setDetailRequestId(requestIdParam);
    setDetailDialogOpen(true);
  }, [requestIdParam, user?.id]);

  const clearRequestIdFromUrl = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('requestId');
        return next;
      },
      { replace: true }
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!user?.id) throw new Error('Usuario no identificado');

      await supportRequestsAPI.create({
        requesterId: user.id,
        title,
        description,
        priority,
        contactEmail,
        contactPhone,
      });

      toast.success('¡Solicitud de apoyo enviada exitosamente!');
      setTitle('');
      setDescription('');
      setPriority('MEDIA');
      setContactPhone('');
      fetchMyRequests();
    } catch (error: any) {
      const message = error.message || 'Error al enviar la solicitud';
      toast.error(message);
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1>Apoyo Pedagógico</h1>
        <p className="text-muted-foreground mt-1">
          Solicita orientación personalizada de nuestros expertos en tecnología educativa
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <Card className="lg:col-span-2 border-2 border-[#f5f7fb]">
          <CardHeader>
            <CardTitle>Enviar Nueva Solicitud</CardTitle>
            <CardDescription>
              Describe tus necesidades y tu jefe de departamento te brindará apoyo personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Asunto / Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Problemas con la integración de Moodle"
                  className="border-2 border-[#f5f7fb]"
                  required
                  data-testid="support-title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select 
                    value={priority} 
                    onValueChange={(value: any) => setPriority(value)} 
                    required
                  >
                    <SelectTrigger id="priority" className="border-2 border-[#f5f7fb]" data-testid="support-priority">
                      <SelectValue placeholder="Selecciona la prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAJA">Baja - 1-2 semanas</SelectItem>
                      <SelectItem value="MEDIA">Media - 3-5 días</SelectItem>
                      <SelectItem value="ALTA">Alta - 24-48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ej: +57 300 000 0000"
                    className="border-2 border-[#f5f7fb]"
                    required
                    data-testid="support-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Correo de Contacto</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="border-2 border-[#f5f7fb]"
                  required
                  data-testid="support-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Detallada</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Por favor proporciona tantos detalles como sea posible sobre tus necesidades..."
                  className="min-h-[150px] border-2 border-[#f5f7fb]"
                  required
                  data-testid="support-description"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#5454e9] hover:bg-[#4040d0]"
                disabled={isSubmitting || !title || !description || !contactPhone || !contactEmail}
                data-testid="support-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Tips */}
        <div className="space-y-4">
          <Card className="border-2 border-[#f5f7fb]">
            <CardHeader>
              <CardTitle className="text-base">Consejos para Mejor Apoyo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p>✓ Sé específico sobre tu curso y nivel de estudiantes</p>
              </div>
              <div>
                <p>✓ Describe lo que ya has intentado</p>
              </div>
              <div>
                <p>✓ Incluye objetivos de aprendizaje relevantes</p>
              </div>
              <div>
                <p>✓ Menciona cualquier restricción técnica</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#f5f7fb]">
            <CardHeader>
              <CardTitle className="text-base">Tiempo de Respuesta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500 hover:bg-red-600">Alta</Badge>
                <span className="text-muted-foreground">24-48 horas</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">Media</Badge>
                <span className="text-muted-foreground">3-5 días</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#f5f7fb] text-black">Baja</Badge>
                <span className="text-muted-foreground">1-2 semanas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Previous Requests */}
      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Tus Solicitudes Anteriores</CardTitle>
          <CardDescription>Rastrea el estado de tus solicitudes de apoyo</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#5454e9]" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tienes solicitudes anteriores</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="p-4 border-2 border-[#f5f7fb] rounded-lg" data-testid="my-request-item">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={getRequestStatusStyles(request.status)}>
                          {isRequestAnswered(request.status) && <CheckCircle className="h-3 w-3 shrink-0" />}
                          {request.status === 'RECIBIDA' && <AlertCircle className="h-3 w-3 shrink-0" />}
                          {getRequestStatusLabel(request.status)}
                        </span>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority === 'ALTA' ? 'Alta' : request.priority === 'MEDIA' ? 'Media' : 'Baja'}
                        </Badge>
                        <span className="font-medium">{request.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enviada: {new Date(request.createdAt).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      type="button"
                      onClick={() => openRequestDetail(request.id)}
                      className="border-2 border-[#f5f7fb]"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RequestDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailRequestId(null);
            clearRequestIdFromUrl();
          }
        }}
        requestId={detailDialogOpen ? detailRequestId : null}
      />
    </div>
  );
}
