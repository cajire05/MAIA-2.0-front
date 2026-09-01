import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '../components/ui/pagination';
import { chatAPI, type ChatInteraction, type Page } from '../services/api';
import { toast } from 'sonner';

interface DateRange {
  from: string;
  to: string;
}

/** Local calendar day bounds for the API (avoid toISOString() shifting the day vs UTC). */
const toStartOfDayParam = (dateValue: string): string | undefined => {
  if (!dateValue) return undefined;
  return `${dateValue}T00:00:00`;
};

const toEndOfDayParam = (dateValue: string): string | undefined => {
  if (!dateValue) return undefined;
  return `${dateValue}T23:59:59.999999999`;
};

/** Intervalo de actualización automática mientras la pestaña está visible. */
const AUTO_REFRESH_MS = 15_000;

export function ChatHistory() {
  const [interactionsPage, setInteractionsPage] = useState<Page<ChatInteraction> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const pageRef = useRef(page);
  pageRef.current = page;

  const loadInteractions = useCallback(
    async (pageToLoad?: number, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const targetPage = pageToLoad ?? pageRef.current;

      try {
        if (!silent) {
          setIsLoading(true);
          setError(null);
        }

        const data = await chatAPI.getMyInteractions({
          conversationId: conversationId || undefined,
          fromDate: toStartOfDayParam(dateRange.from),
          toDate: toEndOfDayParam(dateRange.to),
          page: targetPage,
          size,
        });

        setInteractionsPage(data);
        setPage(data.number);
        setLastUpdatedAt(new Date());
        if (silent) setError(null);
      } catch (err: unknown) {
        console.error('Error loading chat interactions', err);
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el historial de interacciones. Intenta nuevamente más tarde.';
        if (!silent) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [conversationId, dateRange.from, dateRange.to, size],
  );

  useEffect(() => {
    void loadInteractions(0, { silent: false });
  }, [loadInteractions]);

  useEffect(() => {
    const refreshSilently = () => {
      if (document.visibilityState !== 'visible') return;
      void loadInteractions(pageRef.current, { silent: true });
    };

    const intervalId = window.setInterval(refreshSilently, AUTO_REFRESH_MS);
    document.addEventListener('visibilitychange', refreshSilently);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshSilently);
    };
  }, [loadInteractions]);

  const handleApplyFilters = () => {
    void loadInteractions(0, { silent: false });
  };

  const handleClearFilters = () => {
    setConversationId('');
    setDateRange({ from: '', to: '' });
    pageRef.current = 0;
    setPage(0);
    // loadInteractions se vuelve a ejecutar al cambiar los filtros (useEffect)
  };

  const handlePreviousPage = () => {
    if (!interactionsPage || interactionsPage.number <= 0) return;
    void loadInteractions(interactionsPage.number - 1, { silent: false });
  };

  const handleNextPage = () => {
    if (!interactionsPage) return;
    if (interactionsPage.number >= interactionsPage.totalPages - 1) return;
    void loadInteractions(interactionsPage.number + 1, { silent: false });
  };

  const items = interactionsPage?.content ?? [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Historial de Interacciones con IA</h1>
        <p className="text-muted-foreground mt-1">
          Revisa tus conversaciones anteriores con el asistente IA para hacer seguimiento y
          reutilizar respuestas útiles.
        </p>
        {lastUpdatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Última actualización:{' '}
            {lastUpdatedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>

      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra por identificador de conversación y por rango de fechas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="conversationId">ID de Conversación</Label>
              <Input
                id="conversationId"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                placeholder="Opcional: filtra un hilo específico"
                className="mt-1 border-2 border-[#f5f7fb]"
              />
            </div>
            <div>
              <Label htmlFor="fromDate">Desde</Label>
              <Input
                id="fromDate"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                className="mt-1 border-2 border-[#f5f7fb]"
              />
            </div>
            <div>
              <Label htmlFor="toDate">Hasta</Label>
              <Input
                id="toDate"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                className="mt-1 border-2 border-[#f5f7fb]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClearFilters} className="border-2 border-[#f5f7fb]">
              Limpiar filtros
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="bg-[#5454e9] hover:bg-[#4040d0]"
              disabled={isLoading}
            >
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-2 border-red-100 bg-red-50">
          <CardContent className="p-4 text-red-700">
            <h3 className="font-semibold mb-1">Problema al cargar el historial</h3>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Interacciones</CardTitle>
          <CardDescription>
            Cada registro corresponde a una pregunta enviada y la respuesta generada por el asistente IA.
            Se refresca automáticamente al chatear o al volver a esta pestaña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando historial...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron interacciones con los filtros actuales.
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[480px] pr-4">
                <div className="space-y-4">
                  {items.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="border-2 border-[#f5f7fb] rounded-lg p-4 space-y-3 bg-white"
                    >
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          Conversación: <span className="font-mono">{interaction.conversationId}</span>
                        </span>
                        <span>
                          {new Date(interaction.createdAt).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Pregunta</p>
                          <p className="text-sm whitespace-pre-wrap">{interaction.question}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Respuesta IA</p>
                          <p className="text-sm whitespace-pre-wrap">{interaction.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {interactionsPage && interactionsPage.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePreviousPage();
                          }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-xs text-muted-foreground px-2">
                          Página {interactionsPage.number + 1} de {interactionsPage.totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNextPage();
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

