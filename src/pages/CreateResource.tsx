import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { resourcesAPI } from '../services/api';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Paperclip, X } from 'lucide-react';

const INPUT_CLASS =
  'bg-[#f5f7fb] border-0 rounded-xl h-12 text-sm focus-visible:ring-2 focus-visible:ring-[#5454e9] placeholder:text-[#b0b4be]';

const ACTIVITY_KINDS = [
  { value: 'case_study',    label: 'Caso de estudio'   },
  { value: 'example',       label: 'Ejemplo'           },
  { value: 'best_practice', label: 'Mejor práctica'    },
  { value: 'guide',         label: 'Guía'              },
] as const;

const AIAS_OPTIONS = [
  { value: '1', label: '1: No IA'        },
  { value: '2', label: '2: Planeación'   },
  { value: '3', label: '3: Colaboración' },
  { value: '4', label: '4: Uso pleno'    },
  { value: '5', label: '5: Exploración'  },
] as const;

const FILE_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.gif,.webp,.ppt,.pptx,.doc,.docx,.txt,.csv,.xlsx,.xls';

function aiasToAiUseLevel(v: string): 'Principiante' | 'Intermedio' | 'Avanzado' {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n <= 1) return 'Principiante';
  if (n <= 3) return 'Intermedio';
  return 'Avanzado';
}

function validateFile(f: File): string | null {
  return /\.(pdf|png|jpe?g|gif|webp|pptx?|docx?|txt|csv|xlsx?)$/i.test(f.name)
    ? null
    : 'Tipo de archivo no permitido.';
}

function Field({
  label, htmlFor, required, children,
}: { label: string; htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}{required && <span className="text-[#5454e9] ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function CreateResource() {
  const navigate    = useNavigate();
  const fileRef     = useRef<HTMLInputElement>(null);

  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [category,     setCategory]     = useState('');
  const [discipline,   setDiscipline]   = useState('');
  const [aiasLevel,    setAiasLevel]    = useState('1');
  const [activityKind, setActivityKind] = useState('guide');
  const [url,          setUrl]          = useState('');
  const [file,         setFile]         = useState<File | null>(null);
  const [submitting,   setSubmitting]   = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);
    const err = validateFile(f);
    if (err) { toast.error(err); e.target.value = ''; return; }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t   = title.trim();
    const d   = description.trim();
    const cat = category.trim();
    const dis = discipline.trim();
    if (!t)   return toast.error('El título es obligatorio');
    if (!d)   return toast.error('La descripción es obligatoria');
    if (!cat) return toast.error('La categoría es obligatoria');
    if (!dis) return toast.error('La disciplina es obligatoria');

    const aiasNum = Number.parseInt(aiasLevel, 10);
    setSubmitting(true);
    let createdId: string | undefined;
    try {
      const created = (await resourcesAPI.create({
        title:        t,
        description:  d,
        url:          url.trim() || undefined,
        type:         activityKind,
        category:     cat,
        discipline:   dis,
        activityType: ACTIVITY_KINDS.find((x) => x.value === activityKind)?.label ?? 'General',
        aiUseLevel:   aiasToAiUseLevel(aiasLevel),
        aiasLevel:    Number.isFinite(aiasNum) ? aiasNum : 1,
      })) as { id?: string };

      createdId = created?.id;
      if (!createdId) throw new Error('El servidor no devolvió el id del recurso');
      if (file) await resourcesAPI.uploadAttachment(createdId, file);

      toast.success('Recurso publicado correctamente');
      navigate('/library');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo publicar el recurso');
      if (createdId) { try { await resourcesAPI.delete(createdId); } catch { /* cleanup */ } }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-10">
      <Button
        type="button" variant="ghost" size="sm"
        className="-ml-1 mb-6 gap-1.5 text-[#5454e9] hover:text-[#4040d0] hover:bg-[#5454e9]/5 px-2"
        onClick={() => navigate('/my-resources')}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      {/* Encabezado */}
      <h1 className="text-2xl font-semibold text-foreground mb-8 gap-10 pt-6">
        Compartir Recurso Educativo de IAG
      </h1>

      <form onSubmit={handleSubmit} className="max-w-[720px] flex flex-col gap-10">

        <div  className="flex flex-col gap-10 pt-6">
          <Field label="Título" htmlFor="title" required>
            <Input
              id="title" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Uso de IA en planeación de clase"
              maxLength={255} className={INPUT_CLASS}
              data-testid="create-title"
            />
          </Field>
        </div>
        
        <div className="flex flex-col gap-10 pt-6">
          <Field label="Descripción" htmlFor="description" required>
            <Textarea
              id="description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe cómo se utiliza este recurso..."
              rows={5} maxLength={1000}
              className="bg-[#f5f7fb] border-0 rounded-xl resize-none py-3 px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#5454e9] placeholder:text-[#b0b4be]"
              data-testid="create-description"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-10 pt-6">
          <Field label="Categoría" htmlFor="category" required>
            <Input
              id="category" value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Inteligencia Artificial"
              maxLength={100} className={INPUT_CLASS}
              data-testid="create-category"
            />
          </Field>
          <Field label="Disciplina" htmlFor="discipline" required>
            <Input
              id="discipline" value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              placeholder="Ej: Ciencias Naturales"
              maxLength={100} className={INPUT_CLASS}
              data-testid="create-discipline"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-10 pt-6">
          <Field label="Nivel AIAS">
            <Select value={aiasLevel} onValueChange={setAiasLevel}>
              <SelectTrigger className={`${INPUT_CLASS} border-0 shadow-none px-3`} data-testid="create-aias-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {AIAS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo de Actividad">
            <Select value={activityKind} onValueChange={setActivityKind}>
              <SelectTrigger className={`${INPUT_CLASS} border-0 shadow-none px-3`} data-testid="create-activity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {ACTIVITY_KINDS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div>
          <Field label="URL Asociada (Opcional)" htmlFor="url">
            <Input
              id="url" type="url" value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ej: https://herramienta-ia.com/tutorial"
              className={INPUT_CLASS}
              data-testid="create-url"
            />
          </Field>
        </div>
        
        <div className="flex flex-col gap-4 pt-6">
          <Label className="text-sm font-semibold text-foreground">
            Archivo Adjunto (Opcional)
          </Label>
          <p className="text-xs text-muted-foreground">
            PDF, imágenes, presentaciones (PPT / PPTX) u Office.
          </p>
          <input ref={fileRef} type="file" accept={FILE_ACCEPT} className="sr-only" onChange={onFileChange} />
          {file ? (
            <div className="inline-flex items-center gap-4 rounded-lg border border-[#5454e9]/30 bg-[#5454e9]/5 px-3 py-2 text-sm w-fit max-w-xs">
              <Paperclip className="h-4 w-4 shrink-0 text-[#5454e9]" />
              <span className="truncate text-foreground">{file.name}</span>
              <button type="button" aria-label="Quitar archivo"
                className="ml-1 text-muted-foreground hover:text-destructive"
                onClick={() => setFile(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 w-fit rounded-lg border-2 border-dashed border-[#e2e5ed] bg-[#f5f7fb] px-4 py-2.5 text-sm text-muted-foreground hover:border-[#5454e9]/50 hover:bg-[#5454e9]/5 hover:text-[#5454e9] transition-colors">
              <Paperclip className="h-4 w-4 shrink-0" />
              Elegir archivo
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 pt-6">
          <Button type="submit" disabled={submitting}
            className="h-12 min-w-[180px] rounded-xl bg-[#5454e9] hover:bg-[#4040d0] text-white font-semibold px-10 text-sm"
            data-testid="create-submit">
            {submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publicando…</>
              : 'Publicar recurso'}
          </Button>
          <Button type="button" variant="ghost"
            className="h-12 px-6 text-muted-foreground hover:text-foreground text-sm"
            onClick={() => navigate('/my-resources')}>
            Cancelar
          </Button>
        </div>

      </form>
    </div>
  );
}
