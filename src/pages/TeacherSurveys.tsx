import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { surveysAPI, type PendingSurveyDTO } from '../services/api';
import { toast } from 'sonner';
import { ClipboardList, Loader2, Star } from 'lucide-react';
import type { SurveyQuestionDTO } from '../services/api';

function uniqueQuestions(questions: SurveyQuestionDTO[]): SurveyQuestionDTO[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    if (!q.id || seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

export function TeacherSurveys() {
  const [searchParams] = useSearchParams();
  const invitationFromUrl = searchParams.get('invitationId');
  const [surveys, setSurveys] = useState<PendingSurveyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await surveysAPI.getPending();
      setSurveys(data);
      if (data.length === 0) {
        setActiveId(null);
        return;
      }
      const fromNotification =
        invitationFromUrl &&
        data.some((s) => s.invitationId === invitationFromUrl)
          ? invitationFromUrl
          : null;
      const stillValid = activeId && data.some((s) => s.invitationId === activeId);
      setActiveId(fromNotification ?? (stillValid ? activeId : data[0].invitationId));
    } catch {
      toast.error('No se pudieron cargar las encuestas pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [invitationFromUrl]);

  const active = surveys.find((s) => s.invitationId === activeId);
  const activeQuestions = active ? uniqueQuestions(active.questions) : [];

  const handleSubmit = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      const answers = activeQuestions.map((q) => ({
        questionId: q.id!,
        ratingValue: q.questionType === 'RATING' ? ratings[q.id!] : undefined,
        textValue: q.questionType === 'TEXT' ? textAnswers[q.id!] : undefined,
      }));
      await surveysAPI.respond(active.invitationId, answers);
      toast.success('¡Gracias! Tu respuesta fue registrada.');
      setRatings({});
      setTextAnswers({});
      setActiveId(null);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar la encuesta';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5454e9]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-[#5454e9]" />
          Encuestas de satisfacción
        </h1>
        <p className="text-muted-foreground mt-1">
          Comparte tu retroalimentación para mejorar la plataforma MAIA.
        </p>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tienes encuestas pendientes en este momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {surveys.map((s) => (
                <Button
                  key={s.invitationId}
                  variant={activeId === s.invitationId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveId(s.invitationId)}
                  className={activeId === s.invitationId ? 'bg-[#5454e9]' : ''}
                >
                  {s.title}
                </Button>
              ))}
            </div>
          )}

          {active && (
            <Card>
              <CardHeader>
                <CardTitle>{active.title}</CardTitle>
                <CardDescription>
                  {active.templateName} — Responde antes del{' '}
                  {new Date(active.closesAt).toLocaleDateString('es-CO')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeQuestions.map((q, index) => (
                  <div key={`${q.id}-${index}`} className="space-y-2">
                    <Label>
                      {q.text}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {q.questionType === 'RATING' ? (
                      <div className="flex flex-wrap gap-2 items-end">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const selected = ratings[q.id!];
                          const isActive = selected === n;
                          const isFilled = selected != null && selected >= n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRatings((prev) => ({ ...prev, [q.id!]: n }))}
                              className={`flex flex-col items-center gap-1 min-w-[3rem] px-2 py-2 rounded-lg border transition-colors ${
                                isActive
                                  ? 'bg-[#5454e9] text-white border-[#5454e9]'
                                  : isFilled
                                    ? 'border-[#5454e9]/40 bg-[#eef2ff] text-[#5454e9]'
                                    : 'hover:bg-muted border-border'
                              }`}
                              aria-label={`Calificación ${n} de 5`}
                              aria-pressed={isActive}
                            >
                              <Star
                                className={`h-5 w-5 ${
                                  isFilled ? 'fill-current' : ''
                                }`}
                              />
                              <span className="text-xs font-semibold leading-none">{n}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Textarea
                        value={textAnswers[q.id!] ?? ''}
                        onChange={(e) =>
                          setTextAnswers((prev) => ({ ...prev, [q.id!]: e.target.value }))
                        }
                        placeholder="Escribe tu comentario..."
                        rows={3}
                      />
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#5454e9] hover:bg-[#4545d8] w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar respuestas'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
