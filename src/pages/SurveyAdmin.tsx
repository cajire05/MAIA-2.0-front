import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  surveysAPI,
  departmentsAPI,
  type SurveyInstanceDTO,
  type SurveyReportDTO,
  type SurveyTemplateDTO,
  type SurveyQuestionDTO,
  type Department,
} from '../services/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart3, ClipboardList, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const emptyQuestion = (): SurveyQuestionDTO => ({
  text: '',
  questionType: 'RATING',
  sortOrder: 0,
  required: true,
});

export function SurveyAdmin() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SurveyTemplateDTO[]>([]);
  const [instances, setInstances] = useState<SurveyInstanceDTO[]>([]);
  const [report, setReport] = useState<SurveyReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInterval, setEditInterval] = useState(30);
  const [editActive, setEditActive] = useState(true);
  const [editQuestions, setEditQuestions] = useState<SurveyQuestionDTO[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [surveyDepartmentId, setSurveyDepartmentId] = useState<string>('all');

  if (!user?.isAdministrator) {
    return <Navigate to="/dashboard" replace />;
  }

  const load = async () => {
    try {
      setLoading(true);
      const [t, i, depts] = await Promise.all([
        surveysAPI.admin.listTemplates(),
        surveysAPI.admin.listInstances(),
        departmentsAPI.getAll(),
      ]);
      setTemplates(t);
      setInstances(i);
      setDepartments(depts);
    } catch {
      toast.error('Error al cargar datos de encuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectTemplate = (t: SurveyTemplateDTO) => {
    setSelectedTemplateId(t.id);
    setEditName(t.name);
    setEditDescription(t.description ?? '');
    setEditInterval(t.intervalDays);
    setEditActive(t.active);
    setEditQuestions(t.questions.length ? [...t.questions] : [emptyQuestion()]);
  };

  const startNew = () => {
    setSelectedTemplateId(null);
    setEditName('');
    setEditDescription('');
    setEditInterval(30);
    setEditActive(true);
    setEditQuestions([emptyQuestion()]);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('El nombre de la plantilla es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        active: editActive,
        intervalDays: editInterval,
        questions: editQuestions
          .filter((q) => q.text.trim())
          .map((q, i) => ({ ...q, sortOrder: i })),
      };
      if (selectedTemplateId) {
        await surveysAPI.admin.updateTemplate(selectedTemplateId, payload);
        toast.success('Plantilla actualizada');
      } else {
        await surveysAPI.admin.createTemplate(payload);
        toast.success('Plantilla creada');
      }
      await load();
      startNew();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await surveysAPI.admin.deleteTemplate(id);
      toast.success('Plantilla eliminada');
      if (selectedTemplateId === id) startNew();
      await load();
    } catch {
      toast.error('No se pudo eliminar la plantilla');
    }
  };

  const handleGenerate = async (templateId: string) => {
    setGenerating(templateId);
    try {
      const deptId = surveyDepartmentId === 'all' ? undefined : surveyDepartmentId;
      await surveysAPI.admin.generateInstance(templateId, deptId);
      const deptLabel =
        deptId == null
          ? 'todos los departamentos'
          : departments.find((d) => d.id === deptId)?.name ?? 'el departamento seleccionado';
      toast.success(`Encuesta generada y enviada a docentes de ${deptLabel}`);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al generar encuesta');
    } finally {
      setGenerating(null);
    }
  };

  const loadReport = async (instanceId: string) => {
    try {
      const r = await surveysAPI.admin.getReport(instanceId);
      setReport(r);
    } catch {
      toast.error('Error al cargar el reporte');
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
    <div className="p-8 space-y-8 max-w-6xl mx-auto" data-tour="admin-surveys-content">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-[#5454e9]" />
          Encuestas de satisfacción
        </h1>
        <p className="text-muted-foreground mt-1">
          Plantillas configurables, generación automática, recordatorios y reportes.
        </p>
      </div>

      <Card className="border-2 border-[#f5f7fb]">
        <CardContent className="pt-6">
          <div className="max-w-md space-y-2">
            <Label>Departamento destino al generar encuesta</Label>
            <Select value={surveyDepartmentId} onValueChange={setSurveyDepartmentId}>
              <SelectTrigger className="border-2 border-[#f5f7fb]">
                <SelectValue placeholder="Selecciona departamento" />
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
            <p className="text-xs text-muted-foreground">
              Al pulsar ▶ en una plantilla, la encuesta se enviará solo a docentes del departamento elegido.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Plantillas</CardTitle>
              <CardDescription>Define preguntas y periodicidad (días)</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={startNew}>
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <button type="button" className="text-left flex-1" onClick={() => selectTemplate(t)}>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Cada {t.intervalDays} días · {t.questions.length} preguntas
                    {!t.active && ' · Inactiva'}
                  </p>
                </button>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Generar encuesta ahora"
                    disabled={generating === t.id || !t.active}
                    onClick={() => handleGenerate(t.id)}
                  >
                    {generating === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedTemplateId ? 'Editar plantilla' : 'Nueva plantilla'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Intervalo (días)</Label>
                <Input
                  type="number"
                  min={1}
                  value={editInterval}
                  onChange={(e) => setEditInterval(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <Label htmlFor="active">Activa</Label>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Preguntas</Label>
              {editQuestions.map((q, idx) => (
                <div key={idx} className="border p-3 rounded-lg space-y-2">
                  <Input
                    placeholder="Texto de la pregunta"
                    value={q.text}
                    onChange={(e) => {
                      const next = [...editQuestions];
                      next[idx] = { ...q, text: e.target.value };
                      setEditQuestions(next);
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={q.questionType}
                      onChange={(e) => {
                        const next = [...editQuestions];
                        next[idx] = { ...q, questionType: e.target.value as 'RATING' | 'TEXT' };
                        setEditQuestions(next);
                      }}
                    >
                      <option value="RATING">Calificación 1-5</option>
                      <option value="TEXT">Texto libre</option>
                    </select>
                    <label className="text-sm flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const next = [...editQuestions];
                          next[idx] = { ...q, required: e.target.checked };
                          setEditQuestions(next);
                        }}
                      />
                      Obligatoria
                    </label>
                    {editQuestions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditQuestions(editQuestions.filter((_, i) => i !== idx))}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditQuestions([...editQuestions, emptyQuestion()])}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar pregunta
              </Button>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-[#5454e9] w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar plantilla'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Encuestas generadas
          </CardTitle>
          <CardDescription>Historial y métricas de satisfacción</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {instances.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aún no hay encuestas generadas.</p>
          ) : (
            instances.map((inst) => (
              <div
                key={inst.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{inst.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {inst.completedInvitations}/{inst.totalInvitations} respuestas ·{' '}
                    {new Date(inst.opensAt).toLocaleDateString('es-CO')} —{' '}
                    {new Date(inst.closesAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inst.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {inst.status === 'ACTIVE' ? 'Activa' : 'Cerrada'}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => loadReport(inst.id)}>
                    Ver reporte
                  </Button>
                </div>
              </div>
            ))
          )}

          {report && (
            <div className="mt-6 p-4 bg-[#f5f7fb] rounded-xl space-y-4">
              <h3 className="font-semibold">{report.title}</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold text-[#5454e9]">{report.responseRatePercent}%</p>
                  <p className="text-xs text-muted-foreground">Tasa de respuesta</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold text-[#5454e9]">{report.averageSatisfaction}</p>
                  <p className="text-xs text-muted-foreground">Satisfacción promedio (1-5)</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-2xl font-bold">
                    {report.completedInvitations}/{report.totalInvitations}
                  </p>
                  <p className="text-xs text-muted-foreground">Respuestas</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Distribución de calificaciones</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(report.ratingDistribution).map(([star, count]) => (
                    <span key={star} className="text-sm bg-white px-3 py-1 rounded border">
                      {star}★: {count}
                    </span>
                  ))}
                </div>
              </div>
              {report.questionMetrics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Por pregunta</p>
                  {report.questionMetrics.map((qm) => (
                    <div key={qm.questionId} className="text-sm bg-white p-2 rounded border">
                      {qm.questionText}
                      {qm.averageRating != null && (
                        <span className="ml-2 text-[#5454e9] font-medium">
                          Promedio: {qm.averageRating.toFixed(2)}
                        </span>
                      )}
                      <span className="text-muted-foreground ml-2">({qm.responseCount} resp.)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
