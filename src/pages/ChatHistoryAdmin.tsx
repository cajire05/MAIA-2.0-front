import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '../components/ui/pagination';
import { chatAPI, type ChatInteraction, type Page } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface DateRange {
  from: string;
  to: string;
}

const toStartOfDayParam = (dateValue: string): string | undefined => {
  if (!dateValue) return undefined;
  return `${dateValue}T00:00:00`;
};

const toEndOfDayParam = (dateValue: string): string | undefined => {
  if (!dateValue) return undefined;
  return `${dateValue}T23:59:59.999999999`;
};

export function ChatHistoryAdmin() {
  const { user } = useAuth();
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [interactionsPage, setInteractionsPage] = useState<Page<ChatInteraction> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const isDepartmentHead = user?.role === 'department_head';

  const loadInteractions = async (pageToLoad = page) => {
    const email = targetUserEmail.trim().toLowerCase();
    if (!email) {
      setInteractionsPage(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await chatAPI.getUserInteractionsByEmail(email, {
        fromDate: toStartOfDayParam(dateRange.from),
        toDate: toEndOfDayParam(dateRange.to),
        page: pageToLoad,
        size,
      });

      setInteractionsPage(data);
      setPage(data.number);
    } catch (err: any) {
      console.error('Error loading user chat interactions', err);
      const message =
        err?.message ||
        'No se pudo cargar el historial de interacciones del usuario. Verifica el correo e intenta nuevamente.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDepartmentHead) {
      setError('No tienes permisos para acceder a esta vista.');
    }
  }, [isDepartmentHead]);

  const handleApplyFilters = () => {
    loadInteractions(0);
  };

  const handleClearFilters = () => {
    setTargetUserEmail('');
    setDateRange({ from: '', to: '' });
    setInteractionsPage(null);
  };

  const handlePreviousPage = () => {
    if (!interactionsPage || interactionsPage.number <= 0) return;
    loadInteractions(interactionsPage.number - 1);
  };

  const handleNextPage = () => {
    if (!interactionsPage) return;
    if (interactionsPage.number >= interactionsPage.totalPages - 1) return;
    loadInteractions(interactionsPage.number + 1);
  };

  const items = interactionsPage?.content ?? [];

  if (!isDepartmentHead) {
    return (
      <div className="p-8">
        <Card className="border-2 border-red-100 bg-red-50">
          <CardContent className="p-4 text-red-700">
            <h1 className="font-semibold mb-1">Acceso restringido</h1>
            <p className="text-sm">
              Solo los usuarios con rol de coordinación de departamento pueden consultar el historial de interacciones de otros usuarios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Historial de Interacciones por Usuario</h1>
        <p className="text-muted-foreground mt-1">
          Explora y analiza las conversaciones de los docentes con el asistente IA para seguimiento y evaluación de uso.
        </p>
      </div>

      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Usa el correo institucional del docente (por ejemplo docente@maia.com). Puedes acotar por fechas si lo necesitas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="userEmail">Correo del usuario</Label>
              <Input
                id="userEmail"
                type="email"
                autoComplete="email"
                value={targetUserEmail}
                onChange={(e) => setTargetUserEmail(e.target.value)}
                placeholder="docente@maia.com"
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
              disabled={isLoading || !targetUserEmail.trim()}
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!targetUserEmail.trim() ? (
            <div className="py-12 text-center text-muted-foreground">
              Ingresa el correo del docente y aplica filtros para ver su historial.
            </div>
          ) : isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando historial...</div>
          ) : !interactionsPage || items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron interacciones para este usuario con los filtros actuales.
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
                          Usuario: <span className="font-mono">{interaction.userId}</span>
                        </span>
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

