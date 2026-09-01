import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';
import { supportRequestsAPI, type RequestDetail } from '../services/api';
import { getRequestStatusLabel, getRequestStatusStyles } from '../utils/requestStatus';
import { toast } from 'sonner';

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'ALTA':
      return 'bg-red-500 hover:bg-red-600';
    case 'MEDIA':
      return 'bg-[#5454e9] hover:bg-[#4040d0]';
    case 'BAJA':
      return 'bg-[#f5f7fb] text-black';
    default:
      return '';
  }
}

type RequestDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set and open is true, loads and shows this request */
  requestId: string | null;
};

export function RequestDetailDialog({
  open,
  onOpenChange,
  requestId,
}: RequestDetailDialogProps) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !requestId) {
      if (!open) setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDetail(null);

    supportRequestsAPI
      .getById(requestId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Error al cargar los detalles de la solicitud');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, requestId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Solicitud</DialogTitle>
          {detail && (
            <DialogDescription>
              Enviada el{' '}
              {new Date(detail.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#5454e9]" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div>
              <Label>Estado y Prioridad</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className={getRequestStatusStyles(detail.status)}>
                  {getRequestStatusLabel(detail.status)}
                </span>
                <Badge className={getPriorityColor(detail.priority)}>
                  Prioridad: {detail.priority}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Asunto</Label>
              <div className="text-sm font-medium mt-1">{detail.title}</div>
            </div>

            <div>
              <Label>Descripción</Label>
              <div className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded border-2 border-[#f5f7fb] whitespace-pre-wrap">
                {detail.description}
              </div>
            </div>

            {detail.responseText && (
              <div>
                <Label>Respuesta del Equipo de Apoyo</Label>
                <div className="text-sm mt-1 p-3 bg-[#5454e9]/5 rounded border-2 border-[#5454e9]/20 whitespace-pre-wrap">
                  {detail.responseText}
                </div>
                {detail.assigneeName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atendido por: {detail.assigneeName}
                  </p>
                )}
                {detail.resolvedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contestada el{' '}
                    {new Date(detail.resolvedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}

            {!detail.responseText && (
              <div className="p-4 bg-muted rounded border-2 border-[#f5f7fb]">
                <p className="text-sm text-muted-foreground">
                  Tu solicitud está siendo revisada por nuestro equipo. Recibirás una respuesta pronto.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se pudieron cargar los detalles
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
