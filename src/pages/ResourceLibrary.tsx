import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Search, Heart, BookOpen, FileText, Lightbulb, BookMarked, FolderHeart, Plus, Trash2, FilterX } from 'lucide-react';
import type { Resource } from '../data/mockData';
import {
  getAiasLevelLabel,
  getExperienceLevelLabel,
  getResourceTypeLabel,
} from '../utils/resourceLabels';
import { sortResourcesByNewestFirst } from '../utils/recentResources';
import { toast } from 'sonner';
import { resourcesAPI, favoritesAPI, favoriteListsAPI } from '../services/api';
import type { FavoriteListDTO } from '../services/api';

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

function normalizeResourceType(apiType: string | undefined): Resource['type'] {
  const raw = String(apiType ?? '')
    .toLowerCase()
    .replace(/^guias$/i, 'guide');
  if (raw === 'guide' || raw === 'guia' || raw === 'guias' || raw === 'video' || raw === 'documento' || raw === 'plantilla') {
    return 'guide';
  }
  if (
    raw === 'case_study' ||
    raw === 'caso' ||
    raw === 'caso_de_estudio' ||
    raw === 'study'
  )
    return 'case_study';
  if (raw === 'example' || raw === 'ejemplo') return 'example';
  if (
    raw === 'best_practice' ||
    raw === 'bes_practices' ||
    raw === 'mejor_practic' ||
    raw === 'practice'
  )
    return 'best_practice';
  if (['case_study', 'example', 'best_practice', 'guide'].includes(raw)) return raw as Resource['type'];
  return 'guide';
}

function mapAiExperienceToLevel(ai?: string, levelFallback?: string): Resource['level'] {
  const lv = levelFallback ?? '';
  if (['beginner', 'intermediate', 'advanced'].includes(lv)) return lv as Resource['level'];
  const x = String(ai ?? '').toLowerCase();
  if (['beginner', 'intermediate', 'advanced'].includes(x)) return x as Resource['level'];
  if (x.includes('princip')) return 'beginner';
  if (x.includes('inter')) return 'intermediate';
  if (x.includes('avan')) return 'advanced';
  return 'beginner';
}

function normalizeAiasLevel(raw: unknown): Resource['aiasLevel'] | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const sRaw = String(raw).toLowerCase();
  const m = sRaw.match(/nivel[_\s]*([1-5])/);
  if (m) return `nivel_${m[1]}` as Resource['aiasLevel'];
  const n =
    typeof raw === 'number' && Number.isFinite(raw)
      ? raw
      : Number.parseInt(sRaw.replace(/\D/g, '') || '0', 10);
  if (n >= 1 && n <= 5) return `nivel_${n}` as Resource['aiasLevel'];
  return undefined;
}

export function ResourceLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [aiasLevelFilter, setAiasLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [collections, setCollections] = useState<FavoriteListDTO[]>([]);
  const [togglingFavorites, setTogglingFavorites] = useState<Set<string>>(new Set());
  const [resourcePendingDelete, setResourcePendingDelete] = useState<Resource | null>(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);

  // Fetch resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await resourcesAPI.getAll();
        const apiResources = Array.isArray(data)
          ? data
          : (data as any)?.content || (data as any)?.items || [];

        const mappedResources: Resource[] = apiResources.map((item: any) => ({
          id: String(item.id),
          title: item.title ?? 'Recurso sin título',
          description: item.description ?? '',
          type: normalizeResourceType(item.type),
          level: mapAiExperienceToLevel(item.aiUseLevel, item.level),
          aiasLevel: normalizeAiasLevel(item.aiasLevel),
          discipline: item.discipline ?? 'General',
          activity: item.activityType ?? item.activity ?? 'General',
          activityType: item.activityType ?? item.activity ?? 'General',
          dateAdded:
            typeof item.createdAt === 'string'
              ? item.createdAt
              : item.dateAdded ?? new Date().toISOString(),
          url: item.url,
          attachmentPath: item.attachmentPath ?? item.attachmentUrl,
          isFavorite: item.isFavorite,
          authorId: item.authorId != null ? String(item.authorId) : undefined,
        }));

        setResources(sortResourcesByNewestFirst(mappedResources));
      } catch (err: any) {
        console.error('Error loading resources from backend', err);
        const message =
          err?.message || 'No se pudieron cargar los recursos desde el servidor.';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Fetch favorites from backend
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await favoritesAPI.getAll();
        const favs = Array.isArray(data) ? data : (data as any)?.content || (data as any)?.items || [];
        const favIds = new Set<string>();

        favs.forEach((f: any) => {
          if (f.resourceId != null) {
            favIds.add(String(f.resourceId));
          } else if (f.resource?.id != null) {
            favIds.add(String(f.resource.id));
          } else if (f.id != null) {
            favIds.add(String(f.id));
          }
        });

        setFavorites(favIds);
      } catch (err) {
        console.error('Error loading favorites', err);
      }
    };

    fetchFavorites();
  }, []);

  // Fetch collections from backend
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const lists = await favoriteListsAPI.getAll();
        setCollections(lists);
      } catch (err) {
        console.error('Error loading collections', err);
      }
    };

    fetchCollections();
  }, []);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    levelFilter !== 'all' ||
    aiasLevelFilter !== 'all' ||
    typeFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('all');
    setAiasLevelFilter('all');
    setTypeFilter('all');
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || resource.level === levelFilter;
    const aiasDigit = normalizeAiasLevel(resource.aiasLevel)?.replace('nivel_', '');
    const matchesAiasLevel = aiasLevelFilter === 'all' || aiasDigit === aiasLevelFilter;
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    return matchesSearch && matchesLevel && matchesAiasLevel && matchesType;
  });

  const toggleFavorite = async (id: string) => {
    if (togglingFavorites.has(id)) return;

    setTogglingFavorites((prev) => new Set(prev).add(id));

    // Optimistic UI update
    const wasFavorite = favorites.has(id);
    const newFavorites = new Set(favorites);
    if (wasFavorite) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);

    try {
      const result = await favoritesAPI.toggle(id);
      const synced = new Set(newFavorites);
      if (result.isFavorite) {
        synced.add(id);
      } else {
        synced.delete(id);
      }
      setFavorites(synced);
      toast.success(result.message);
    } catch (err: any) {
      // Revert on error
      const reverted = new Set(favorites);
      if (wasFavorite) {
        reverted.add(id);
      } else {
        reverted.delete(id);
      }
      setFavorites(reverted);
      toast.error('Error al actualizar favorito');
      console.error('Error toggling favorite', err);
    } finally {
      setTogglingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAddToCollection = async (listId: string, resourceId: string) => {
    try {
      await favoriteListsAPI.addResource(listId, resourceId);
      const list = collections.find((c) => c.id === listId);
      toast.success(`Recurso agregado a "${list?.name ?? 'colección'}"`);
    } catch (err: any) {
      const message = err?.message || 'Error al agregar recurso a la colección';
      toast.error(message);
      console.error('Error adding resource to collection', err);
    }
  };

  const confirmDeleteResource = async () => {
    if (!resourcePendingDelete) return;
    setIsDeletingResource(true);
    try {
      await resourcesAPI.delete(resourcePendingDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourcePendingDelete.id));
      if (selectedResource?.id === resourcePendingDelete.id) setSelectedResource(null);
      toast.success('Recurso eliminado');
      setResourcePendingDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el recurso';
      toast.error(message);
    } finally {
      setIsDeletingResource(false);
    }
  };

  const isOwnResource = (r: Resource) => Boolean(user?.id && r.authorId && user.id === r.authorId);

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'case_study': return <BookOpen className="h-5 w-5" />;
      case 'example': return <FileText className="h-5 w-5" />;
      case 'best_practice': return <Lightbulb className="h-5 w-5" />;
      case 'guide': return <BookMarked className="h-5 w-5" />;
    }
  };

  const getTypeText = (type: Resource['type']) => getResourceTypeLabel(type);

  const getLevelText = (level: string) =>
    getExperienceLevelLabel(level) || level;

  const getAiasLevelText = (aiasLevel: string) =>
    getAiasLevelLabel(aiasLevel) ?? aiasLevel;



  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Biblioteca de Recursos</h1>
          <p className="text-muted-foreground mt-1">
            Explora recursos curados de integración de IA, casos de estudio y mejores prácticas
          </p>
        </div>
        <Button
          className="bg-[#5454e9] hover:bg-[#4040d0]"
          onClick={() => navigate('/collections')}
        >
          <FolderHeart className="h-4 w-4 mr-2" />
          Ver Colecciones
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-2 border-[#f5f7fb]">
        <CardContent className="p-6" data-tour="library-filters">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-2 border-[#f5f7fb]"
                data-testid="library-search"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="border-2 border-[#f5f7fb]" data-testid="filter-level">
                <SelectValue placeholder="Experiencia con IA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Experiencia con IA</SelectItem>
                <SelectItem value="beginner">Principiante</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={aiasLevelFilter} onValueChange={setAiasLevelFilter}>
              <SelectTrigger className="border-2 border-[#f5f7fb]" data-testid="filter-aias">
                <SelectValue placeholder="Nivel AIAS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Nivel AIAS</SelectItem>
                <SelectItem value="1">1: No IA</SelectItem>
                <SelectItem value="2">2: Planeación</SelectItem>
                <SelectItem value="3">3: Colaboración</SelectItem>
                <SelectItem value="4">4: Uso pleno</SelectItem>
                <SelectItem value="5">5: Exploración</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-2 border-[#f5f7fb]" data-testid="filter-type">
                <SelectValue placeholder="Tipo de actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tipo de actividad</SelectItem>
                <SelectItem value="case_study">Casos de Estudio</SelectItem>
                <SelectItem value="example">Ejemplos</SelectItem>
                <SelectItem value="best_practice">Mejores Prácticas</SelectItem>
                <SelectItem value="guide">Guías</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[#f5f7fb] w-full"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl">
                  {isLoading ? '...' : filteredResources.length}
                </p>
                <p className="text-sm text-muted-foreground">Recursos Encontrados</p>
              </div>
              <BookOpen className="h-8 w-8 text-[#5454e9]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl">{favorites.size}</p>
                <p className="text-sm text-muted-foreground">Favoritos</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl">
                  {isLoading ? '...' : resources.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Recursos</p>
              </div>
              <FileText className="h-8 w-8 text-[#5454e9]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources Grid */}
      {isLoading && (
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="mb-2">Cargando recursos...</h3>
            <p className="text-muted-foreground">
              Estamos recuperando la biblioteca de casos y buenas prácticas desde el servidor.
            </p>
          </CardContent>
        </Card>
      )}

      {error && !isLoading && (
        <Card className="border-2 border-red-100 bg-red-50">
          <CardContent className="p-4 text-red-700">
            <h3 className="font-semibold mb-1">Problema al cargar la biblioteca</h3>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource, idx) => (
          <Card
            key={resource.id}
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-[#f5f7fb]"
            data-tour={idx === 0 ? 'library-first-card' : undefined}
            data-testid="resource-card"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="p-2 bg-[#5454e9]/10 rounded-lg">
                  {getTypeIcon(resource.type)}
                </div>
                <div className="flex items-center gap-1">
                  {/* Add to collection dropdown */}
                  {collections.length > 0 && (
                    <Select onValueChange={(listId) => handleAddToCollection(listId, resource.id)}>
                      <SelectTrigger className="h-8 w-8 p-0 border-0 bg-transparent [&>svg]:hidden">
                        <Plus className="h-4 w-4 text-muted-foreground hover:text-[#5454e9]" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {isOwnResource(resource) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Eliminar mi recurso"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setResourcePendingDelete(resource);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleFavorite(resource.id)}
                    disabled={togglingFavorites.has(resource.id)}
                    data-testid="resource-favorite-btn"
                  >
                    <Heart
                      className={`h-4 w-4 ${favorites.has(resource.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-muted-foreground'
                        }`}
                    />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-2">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-[#f5f7fb]">
                  {getTypeText(resource.type)}
                </Badge>
                <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">
                  {getLevelText(resource.level)}
                </Badge>
                {resource.aiasLevel && (
                  <Badge variant="secondary" className="bg-[#f5f7fb] text-black">
                    {getAiasLevelText(resource.aiasLevel)}
                  </Badge>
                )}
              </div>
              <div className="pt-2 border-t border-[#f5f7fb]">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Disciplina:</span> {resource.discipline}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Actividad:</span> {resource.activity}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Agregado:</span> {new Date(resource.dateAdded).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <Button
                className="w-full bg-[#5454e9] hover:bg-[#4040d0]"
                onClick={() => setSelectedResource(resource)}
              >
                Ver Recurso
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && filteredResources.length === 0 && (
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="mb-2">No se encontraron recursos</h3>
            <p className="text-muted-foreground">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-3xl">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedResource.title}</DialogTitle>
                <DialogDescription>{selectedResource.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-[#f5f7fb]">
                    {getTypeText(selectedResource.type)}
                  </Badge>
                  <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">
                    {getLevelText(selectedResource.level)}
                  </Badge>
                  {selectedResource.aiasLevel && (
                    <Badge variant="secondary" className="bg-[#f5f7fb] text-black">
                      {getAiasLevelText(selectedResource.aiasLevel)}
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Disciplina:</span> {selectedResource.discipline}
                  </p>
                  <p>
                    <span className="font-medium">Actividad:</span> {selectedResource.activity}
                  </p>
                  <p>
                    <span className="font-medium">Agregado:</span>{' '}
                    {new Date(selectedResource.dateAdded).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
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
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!resourcePendingDelete}
        onOpenChange={(open) => {
          if (!open) setResourcePendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará de la biblioteca. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingResource}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingResource}
              onClick={() => void confirmDeleteResource()}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}