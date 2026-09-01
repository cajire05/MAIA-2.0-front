import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
    FolderHeart,
    FolderPlus,
    Pencil,
    Trash2,
    ArrowLeft,
    BookOpen,
    FileText,
    Lightbulb,
    BookMarked,
    X,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { favoriteListsAPI, resourcesAPI } from '../services/api';
import type { FavoriteListDTO, FavoriteListDetailDTO, FavoriteResourceDTO } from '../services/api';
import {
    getActivityTypeLabel,
    getAiasLevelLabel,
    getCategoryLabel,
    getExperienceLevelLabel,
    parseAiasLevel,
} from '../utils/resourceLabels';

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

interface CollectionResourceDetail {
    id: string;
    title: string;
    description: string;
    type: string;
    category?: string;
    discipline?: string;
    activityType?: string;
    level?: string;
    aiUseLevel?: string;
    aiasLevel?: number;
    dateAdded?: string;
    url?: string;
    attachmentPath?: string;
}

function normalizeListResource(item: FavoriteResourceDTO | Record<string, unknown>): FavoriteResourceDTO {
    const raw = item as Record<string, unknown>;
    const nested = raw.resource as Record<string, unknown> | undefined;
    const src = nested ?? raw;
    const resourceId = String(raw.resourceId ?? src.id ?? raw.id ?? '');
    return {
        id: String(raw.id ?? resourceId),
        resourceId,
        title: src.title != null ? String(src.title) : undefined,
        description: src.description != null ? String(src.description) : undefined,
        type: src.type != null ? String(src.type) : undefined,
        category: src.category != null ? String(src.category) : undefined,
        level: src.aiUseLevel != null ? String(src.aiUseLevel) : src.level != null ? String(src.level) : undefined,
        aiasLevel: src.aiasLevel != null ? String(src.aiasLevel) : undefined,
        discipline: src.discipline != null ? String(src.discipline) : undefined,
        activity: src.activityType != null
            ? String(src.activityType)
            : src.activity != null
                ? String(src.activity)
                : undefined,
        activityType: src.activityType != null ? String(src.activityType) : undefined,
        dateAdded: src.createdAt != null ? String(src.createdAt) : raw.dateAdded != null ? String(raw.dateAdded) : undefined,
        url: src.url != null ? String(src.url) : undefined,
        attachmentPath: src.attachmentPath != null ? String(src.attachmentPath) : undefined,
    };
}

function favoriteToDetail(r: FavoriteResourceDTO): CollectionResourceDetail {
    const resId = r.resourceId ?? r.id;
    return {
        id: resId,
        title: r.title ?? 'Recurso',
        description: r.description ?? '',
        type: r.type ?? 'guide',
        category: r.category,
        discipline: r.discipline,
        activityType: r.activityType ?? r.activity,
        level: r.level,
        aiasLevel: parseAiasLevel(r.aiasLevel),
        dateAdded: r.dateAdded,
        url: r.url,
        attachmentPath: r.attachmentPath,
    };
}

function mapApiResource(item: Record<string, unknown>): CollectionResourceDetail {
    return {
        id: String(item.id ?? ''),
        title: String(item.title ?? 'Sin título'),
        description: String(item.description ?? ''),
        type: String(item.type ?? 'guide'),
        category: item.category != null ? String(item.category) : undefined,
        discipline: item.discipline != null ? String(item.discipline) : undefined,
        activityType: item.activityType != null
            ? String(item.activityType)
            : item.activity != null
                ? String(item.activity)
                : undefined,
        level: item.level != null ? String(item.level) : undefined,
        aiUseLevel: item.aiUseLevel != null ? String(item.aiUseLevel) : undefined,
        aiasLevel: parseAiasLevel(item.aiasLevel),
        dateAdded: item.createdAt != null
            ? String(item.createdAt)
            : item.dateAdded != null
                ? String(item.dateAdded)
                : undefined,
        url: item.url != null ? String(item.url) : undefined,
        attachmentPath: item.attachmentPath != null ? String(item.attachmentPath) : undefined,
    };
}

function ResourceMetaBadges({ resource }: { resource: FavoriteResourceDTO }) {
    const aias = getAiasLevelLabel(parseAiasLevel(resource.aiasLevel));
    const activity = getActivityTypeLabel(resource.activityType ?? resource.activity);
    const category = resource.category?.trim() ? getCategoryLabel(resource.category) : '';

    if (!aias && !activity && !category) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {aias && (
                <Badge variant="secondary" className="bg-[#f5f7fb] text-foreground text-xs">
                    {aias}
                </Badge>
            )}
            {activity && (
                <Badge variant="outline" className="border-[#f5f7fb]">
                    {activity}
                </Badge>
            )}
            {category && (
                <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">
                    {category}
                </Badge>
            )}
        </div>
    );
}

function formatDate(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Collections() {
    const [collections, setCollections] = useState<FavoriteListDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Detail view
    const [selectedList, setSelectedList] = useState<FavoriteListDetailDTO | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Create dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');

    // Edit dialog
    const [editingList, setEditingList] = useState<FavoriteListDTO | null>(null);
    const [editName, setEditName] = useState('');

    // Delete dialog
    const [deletingList, setDeletingList] = useState<FavoriteListDTO | null>(null);

    // Resource detail dialog (within collection view)
    const [selectedResource, setSelectedResource] = useState<CollectionResourceDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await favoriteListsAPI.getAll();
            setCollections(data);
        } catch (err: any) {
            const msg = err?.message || 'Error al cargar las colecciones';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDetail = async (list: FavoriteListDTO) => {
        try {
            setIsLoadingDetail(true);
            const detail = await favoriteListsAPI.getDetail(list.id);
            setSelectedList({
                ...detail,
                resources: detail.resources.map((r) => normalizeListResource(r)),
            });
        } catch (err: any) {
            toast.error(err?.message || 'Error al cargar el detalle de la colección');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.error('Por favor ingresa un nombre');
            return;
        }
        try {
            const created = await favoriteListsAPI.create(newName.trim());
            setCollections((prev) => [...prev, created]);
            toast.success(`Colección "${newName}" creada`);
            setNewName('');
            setIsCreateOpen(false);
        } catch (err: any) {
            toast.error(err?.message || 'Error al crear la colección');
        }
    };

    const handleEditName = async () => {
        if (!editingList || !editName.trim()) return;
        try {
            const updated = await favoriteListsAPI.updateName(editingList.id, editName.trim());
            setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            if (selectedList && selectedList.id === updated.id) {
                setSelectedList({ ...selectedList, name: updated.name });
            }
            toast.success('Nombre actualizado');
            setEditingList(null);
            setEditName('');
        } catch (err: any) {
            toast.error(err?.message || 'Error al actualizar el nombre');
        }
    };

    const handleDelete = async () => {
        if (!deletingList) return;
        try {
            await favoriteListsAPI.delete(deletingList.id);
            setCollections((prev) => prev.filter((c) => c.id !== deletingList.id));
            if (selectedList && selectedList.id === deletingList.id) {
                setSelectedList(null);
            }
            toast.success(`Colección "${deletingList.name}" eliminada`);
            setDeletingList(null);
        } catch (err: any) {
            toast.error(err?.message || 'Error al eliminar la colección');
        }
    };

    const handleRemoveResource = async (resourceId: string) => {
        if (!selectedList) return;
        try {
            await favoriteListsAPI.removeResource(selectedList.id, resourceId);
            setSelectedList({
                ...selectedList,
                resources: selectedList.resources.filter((r) => (r.resourceId ?? r.id) !== resourceId),
            });
            if (selectedResource?.id === resourceId) setSelectedResource(null);
            toast.success('Recurso removido de la colección');
        } catch (err: any) {
            toast.error(err?.message || 'Error al remover el recurso');
        }
    };

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'case_study': return <BookOpen className="h-4 w-4" />;
            case 'example': return <FileText className="h-4 w-4" />;
            case 'best_practice': return <Lightbulb className="h-4 w-4" />;
            case 'guide': return <BookMarked className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const openResourceDetail = async (resource: FavoriteResourceDTO) => {
        const initial = favoriteToDetail(resource);
        setSelectedResource(initial);
        setDetailLoading(true);
        try {
            const full = await resourcesAPI.getById(initial.id);
            setSelectedResource(mapApiResource(full as Record<string, unknown>));
        } catch {
            // Mantener datos de la tarjeta si falla la carga del detalle
        } finally {
            setDetailLoading(false);
        }
    };

    // ========== Detail view ==========
    if (selectedList) {
        return (
            <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSelectedList(null);
                            setSelectedResource(null);
                        }}
                        className="h-10 w-10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="flex items-center gap-2">
                            <FolderHeart className="h-6 w-6 text-[#5454e9]" />
                            {selectedList.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {selectedList.resources.length} recurso{selectedList.resources.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-2 border-[#f5f7fb]"
                        onClick={() => {
                            setEditingList({ id: selectedList.id, name: selectedList.name });
                            setEditName(selectedList.name);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>

                {selectedList.resources.length === 0 ? (
                    <Card className="border-2 border-[#f5f7fb]">
                        <CardContent className="p-12 text-center">
                            <FolderHeart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="mb-2">Colección vacía</h3>
                            <p className="text-muted-foreground">
                                Agrega recursos desde la Biblioteca para empezar a organizar tu colección
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="collections-list">
                        {selectedList.resources.map((resource: FavoriteResourceDTO) => {
                            const resId = resource.resourceId ?? resource.id;
                            return (
                                <Card key={resId} className="border-2 border-[#f5f7fb] hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="p-2 bg-[#5454e9]/10 rounded-lg">
                                                {getTypeIcon(resource.type)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleRemoveResource(resId);
                                                }}
                                                title="Remover de la colección"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <CardTitle className="mt-2 text-base">{resource.title ?? 'Recurso'}</CardTitle>
                                        {resource.description && (
                                            <CardDescription>{resource.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <ResourceMetaBadges resource={resource} />
                                        <Button
                                            type="button"
                                            className="w-full mt-4 bg-[#5454e9] hover:bg-[#4040d0] text-white"
                                            onClick={() => void openResourceDetail(resource)}
                                        >
                                            Ver detalle
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Dialog
                    open={!!selectedResource}
                    onOpenChange={(open) => { if (!open) setSelectedResource(null); }}
                >
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
                                            {selectedResource.aiasLevel != null && (
                                                <Badge variant="secondary" className="bg-[#f5f7fb] text-foreground text-xs">
                                                    {getAiasLevelLabel(selectedResource.aiasLevel)}
                                                </Badge>
                                            )}
                                            {selectedResource.activityType && (
                                                <Badge variant="outline" className="border-[#f5f7fb]">
                                                    {getActivityTypeLabel(selectedResource.activityType)}
                                                </Badge>
                                            )}
                                            {selectedResource.category && (
                                                <Badge className="bg-[#5454e9] hover:bg-[#4040d0]">
                                                    {getCategoryLabel(selectedResource.category)}
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
                                                    <span className="font-medium">Disciplina:</span>{' '}
                                                    {selectedResource.discipline}
                                                </p>
                                            )}
                                            {selectedResource.activityType && (
                                                <p>
                                                    <span className="font-medium">Actividad:</span>{' '}
                                                    {getActivityTypeLabel(selectedResource.activityType)}
                                                </p>
                                            )}
                                            {selectedResource.dateAdded && (
                                                <p>
                                                    <span className="font-medium">Agregado:</span>{' '}
                                                    {formatDate(selectedResource.dateAdded)}
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

                {/* Edit name dialog */}
                <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Nombre de Colección</DialogTitle>
                            <DialogDescription>Ingresa el nuevo nombre para esta colección</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nombre</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="border-2 border-[#f5f7fb]"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleEditName(); }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleEditName} className="flex-1 bg-[#5454e9] hover:bg-[#4040d0]">
                                    Guardar
                                </Button>
                                <Button onClick={() => setEditingList(null)} variant="outline" className="border-2 border-[#f5f7fb]">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ========== List view ==========
    return (
        <div className="p-8 space-y-6" data-tour="collections-list">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2">
                        <FolderHeart className="h-7 w-7 text-[#5454e9]" />
                        Mis Colecciones
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Organiza tus recursos en listas personalizadas
                    </p>
                </div>
                <Button
                    className="bg-[#5454e9] hover:bg-[#4040d0]"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Nueva Colección
                </Button>
            </div>

            {/* Loading */}
            {isLoading && (
                <Card className="border-2 border-[#f5f7fb]">
                    <CardContent className="p-12 text-center">
                        <FolderHeart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
                        <h3 className="mb-2">Cargando colecciones...</h3>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && !isLoading && (
                <Card className="border-2 border-red-100 bg-red-50">
                    <CardContent className="p-4 text-red-700">
                        <h3 className="font-semibold mb-1">Error al cargar colecciones</h3>
                        <p className="text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!isLoading && !error && collections.length === 0 && (
                <Card className="border-2 border-[#f5f7fb]">
                    <CardContent className="p-12 text-center">
                        <FolderHeart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="mb-2">No tienes colecciones aún</h3>
                        <p className="text-muted-foreground mb-4">
                            Crea tu primera colección para organizar tus recursos favoritos
                        </p>
                        <Button
                            className="bg-[#5454e9] hover:bg-[#4040d0]"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Crear Colección
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Collections grid */}
            {!isLoading && collections.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((col) => (
                        <Card
                            key={col.id}
                            className="hover:shadow-lg transition-shadow border-2 border-[#f5f7fb] cursor-pointer group"
                            onClick={() => handleOpenDetail(col)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="p-3 bg-[#5454e9]/10 rounded-lg">
                                        <FolderHeart className="h-6 w-6 text-[#5454e9]" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                setEditingList(col);
                                                setEditName(col.name);
                                            }}
                                            title="Editar nombre"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                            onClick={() => setDeletingList(col)}
                                            title="Eliminar colección"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="mt-2">{col.name}</CardTitle>
                                <CardDescription>
                                    {col.resourceCount !== undefined
                                        ? `${col.resourceCount} recurso${col.resourceCount !== 1 ? 's' : ''}`
                                        : 'Ver contenido'}
                                </CardDescription>
                            </CardHeader>
                            {col.createdAt && (
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">
                                        Creada: {new Date(col.createdAt).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Loading detail overlay */}
            {isLoadingDetail && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5454e9] mx-auto" />
                        <p className="mt-3 text-sm text-muted-foreground">Cargando colección...</p>
                    </div>
                </div>
            )}

            {/* Create dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Colección</DialogTitle>
                        <DialogDescription>
                            Organiza tus recursos favoritos en colecciones temáticas
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-collection-name">Nombre de la Colección</Label>
                            <Input
                                id="new-collection-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="ej. Evaluación con IA, Recursos de Programación..."
                                className="border-2 border-[#f5f7fb]"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} className="flex-1 bg-[#5454e9] hover:bg-[#4040d0]">
                                Crear Colección
                            </Button>
                            <Button onClick={() => setIsCreateOpen(false)} variant="outline" className="border-2 border-[#f5f7fb]">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Nombre de Colección</DialogTitle>
                        <DialogDescription>Ingresa el nuevo nombre para esta colección</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-collection-name">Nombre</Label>
                            <Input
                                id="edit-collection-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border-2 border-[#f5f7fb]"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleEditName(); }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleEditName} className="flex-1 bg-[#5454e9] hover:bg-[#4040d0]">
                                Guardar
                            </Button>
                            <Button onClick={() => setEditingList(null)} variant="outline" className="border-2 border-[#f5f7fb]">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deletingList} onOpenChange={(open) => !open && setDeletingList(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar colección?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la colección "{deletingList?.name}" permanentemente.
                            Los recursos no se eliminarán de la biblioteca.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-2 border-[#f5f7fb]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
