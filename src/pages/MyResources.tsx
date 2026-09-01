import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Trash2, BookOpen, FileText, Lightbulb, BookMarked, Loader2 } from 'lucide-react';
import { resourcesAPI } from '../services/api';
import { toast } from 'sonner';
import {
  getActivityTypeLabel,
  getAiasLevelLabel,
  getCategoryLabel,
  getExperienceLevelLabel,
  getResourceTypeLabel,
} from '../utils/resourceLabels';
import { sortResourcesByNewestFirst } from '../utils/recentResources';

const API_ATTACHMENT_BASE =
  import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function attachmentDownloadUrl(storagePath: string): string {
  const norm = storagePath.replace(/^\/+/, '').replace(/\\/g, '/');
  const encoded = norm
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${API_ATTACHMENT_BASE}/api/library/attachments/${encoded}`;
}

interface MyResource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  discipline?: string;
  activityType?: string;
  aiUseLevel?: string;
  aiasLevel?: number;
  createdAt?: string;
  url?: string;
  attachmentPath?: string;
}

function typeIcon(type: string) {
  switch (type) {
    case 'case_study': return <BookOpen className="h-5 w-5 text-[#5454e9]" />;
    case 'example':    return <FileText  className="h-5 w-5 text-[#5454e9]" />;
    case 'best_practice': return <Lightbulb className="h-5 w-5 text-[#5454e9]" />;
    default:           return <BookMarked className="h-5 w-5 text-[#5454e9]" />;
  }
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapResource(item: Record<string, unknown>): MyResource {
  return {
    id:            String(item.id ?? ''),
    title:         String(item.title ?? 'Sin título'),
    description:   String(item.description ?? ''),
    type:          String(item.type ?? 'guide'),
    category:      String(item.category ?? ''),
    discipline:    item.discipline != null ? String(item.discipline) : undefined,
    activityType:  item.activityType != null
      ? String(item.activityType)
      : item.activity != null
        ? String(item.activity)
        : undefined,
    aiUseLevel:    item.aiUseLevel != null ? String(item.aiUseLevel) : undefined,
    aiasLevel:     typeof item.aiasLevel === 'number' ? item.aiasLevel : undefined,
    createdAt:     item.createdAt != null ? String(item.createdAt) : undefined,
    url:           item.url != null ? String(item.url) : undefined,
    attachmentPath: item.attachmentPath != null ? String(item.attachmentPath) : undefined,
  };
}

export function MyResources() {
  const navigate = useNavigate();
  const [resources, setResources]       = useState<MyResource[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [selectedResource, setSelectedResource] = useState<MyResource | null>(null);
  const [detailLoading, setDetailLoading]       = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MyResource | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await resourcesAPI.getMyResources();
        const items: unknown[] = Array.isArray(data)
          ? data
          : ((data as Record<string, unknown>)?.content as unknown[] ?? []);
        setResources(
          sortResourcesByNewestFirst(
            items.map((r: unknown) => mapResource(r as Record<string, unknown>)),
          ),
        );
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudieron cargar tus recursos');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await resourcesAPI.delete(pendingDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      if (selectedResource?.id === pendingDelete.id) setSelectedResource(null);
      toast.success('Recurso eliminado');
      setPendingDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el recurso');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDetail = async (r: MyResource) => {
    setSelectedResource(r);
    setDetailLoading(true);
    try {
      const full = await resourcesAPI.getById(r.id);
      setSelectedResource(mapResource(full as Record<string, unknown>));
    } catch {
      // Mantener datos de la tarjeta si falla la carga del detalle
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mis Recursos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recursos educativos que has publicado en la biblioteca.
          </p>
        </div>
        <Button
          onClick={() => navigate('/library/create')}
          className="bg-[#5454e9] hover:bg-[#4040d0] text-white gap-2 h-10 px-5"
        >
          <Plus className="h-4 w-4" />
          Crear recurso
        </Button>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando tus recursos…
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && resources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="p-4 rounded-full bg-[#f5f7fb]">
            <BookMarked className="h-8 w-8 text-[#5454e9]/60" />
          </div>
          <div>
            <p className="font-medium text-foreground">Aún no has creado ningún recurso</p>
            <p className="text-sm text-muted-foreground mt-1">
              Comparte tus experiencias con otros docentes.
            </p>
          </div>
          <Button
            onClick={() => navigate('/library/create')}
            className="mt-2 bg-[#5454e9] hover:bg-[#4040d0] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear mi primer recurso
          </Button>
        </div>
      )}

      {/* Grilla de recursos */}
      {!isLoading && resources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex flex-col border-2 border-[#f5f7fb] rounded-xl p-6 gap-4 bg-white hover:shadow-md transition-shadow"
              data-testid="my-resource-card"
            >
              {/* Cabecera de tarjeta */}
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 rounded-lg bg-[#5454e9]/10">
                  {typeIcon(r.type)}
                </div>
                <button
                  type="button"
                  title="Eliminar recurso"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(r);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                  data-testid="resource-delete-btn"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Contenido */}
              <div className="flex flex-col gap-1 flex-1">
                <p className="font-medium text-foreground leading-snug line-clamp-2">{r.title}</p>
                {r.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-[#f5f7fb] text-xs">
                  {getResourceTypeLabel(r.type)}
                </Badge>
                {r.aiasLevel != null && getAiasLevelLabel(r.aiasLevel) && (
                  <Badge className="bg-[#5454e9]/10 text-[#5454e9] hover:bg-[#5454e9]/20 text-xs font-medium border-0">
                    {getAiasLevelLabel(r.aiasLevel)}
                  </Badge>
                )}
                {r.aiUseLevel && (
                  <Badge variant="secondary" className="bg-[#f5f7fb] text-foreground text-xs">
                    {getExperienceLevelLabel(r.aiUseLevel)}
                  </Badge>
                )}
              </div>

              {/* Pie de tarjeta */}
              <div className="border-t border-[#f5f7fb] pt-3 flex flex-col gap-1">
                {r.category && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Categoría:</span> {getCategoryLabel(r.category)}
                  </p>
                )}
                {r.discipline && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Disciplina:</span> {r.discipline}
                  </p>
                )}
                {r.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Publicado:</span> {formatDate(r.createdAt)}
                  </p>
                )}
              </div>

              <Button
                type="button"
                className="w-full bg-[#5454e9] hover:bg-[#4040d0] text-white"
                onClick={() => void openDetail(r)}
              >
                Ver detalle
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedResource} onOpenChange={(open) => { if (!open) setSelectedResource(null); }}>
        <DialogContent className="max-w-3xl">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedResource.title}</DialogTitle>
                <DialogDescription>
                  {selectedResource.description.trim() || 'Sin descripción'}
                </DialogDescription>
              </DialogHeader>
              {detailLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando detalle…
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-[#f5f7fb]">
                      {getResourceTypeLabel(selectedResource.type)}
                    </Badge>
                    {selectedResource.aiasLevel != null && getAiasLevelLabel(selectedResource.aiasLevel) && (
                      <Badge className="bg-[#5454e9]/10 text-[#5454e9] hover:bg-[#5454e9]/20 text-xs font-medium border-0">
                        {getAiasLevelLabel(selectedResource.aiasLevel)}
                      </Badge>
                    )}
                    {selectedResource.aiUseLevel && (
                      <Badge variant="secondary" className="bg-[#f5f7fb] text-foreground text-xs">
                        {getExperienceLevelLabel(selectedResource.aiUseLevel)}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {selectedResource.category && (
                      <p>
                        <span className="font-medium">Categoría:</span>{' '}
                        {getCategoryLabel(selectedResource.category)}
                      </p>
                    )}
                    {selectedResource.discipline && (
                      <p>
                        <span className="font-medium">Disciplina:</span> {selectedResource.discipline}
                      </p>
                    )}
                    {selectedResource.activityType && (
                      <p>
                        <span className="font-medium">Actividad:</span>{' '}
                        {getActivityTypeLabel(selectedResource.activityType)}
                      </p>
                    )}
                    {selectedResource.createdAt && (
                      <p>
                        <span className="font-medium">Publicado:</span>{' '}
                        {formatDate(selectedResource.createdAt)}
                      </p>
                    )}
                  </div>

                  {selectedResource.url && (
                    <div className="text-xs text-muted-foreground break-words overflow-hidden w-full">
                      <span className="font-medium mr-1">URL asociada:</span>
                      <a
                        href={selectedResource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5454e9] hover:underline inline-block max-w-full break-all"
                      >
                        {selectedResource.url}
                      </a>
                    </div>
                  )}

                  {selectedResource.attachmentPath && (
                    <div className="mt-4">
                      <p className="font-medium mb-1 text-sm">Archivos adjuntos</p>
                      <a
                        href={
                          selectedResource.attachmentPath.startsWith('http')
                            ? selectedResource.attachmentPath
                            : attachmentDownloadUrl(selectedResource.attachmentPath)
                        }
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5454e9] hover:underline text-sm break-all"
                      >
                        {selectedResource.attachmentPath.split('/').pop() ??
                          selectedResource.attachmentPath}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo confirmación eliminación */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" se quitará de la biblioteca. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button" variant="destructive" disabled={isDeleting}
              onClick={() => void confirmDelete()}
              data-testid="delete-confirm-btn"
            >
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Eliminando…</> : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
