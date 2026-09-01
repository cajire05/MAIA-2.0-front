/** Etiquetas en español para metadatos de recursos (UI). */

const TYPE_LABELS: Record<string, string> = {
  case_study: 'Caso de estudio',
  example: 'Ejemplo',
  best_practice: 'Mejor práctica',
  bes_practices: 'Mejor práctica',
  guide: 'Guía',
  guia: 'Guía',
  guias: 'Guía',
  GUIA: 'Guía',
  documento: 'Documento',
  DOCUMENTO: 'Documento',
  plantilla: 'Plantilla',
  PLANTILLA: 'Plantilla',
  video: 'Video',
  VIDEO: 'Video',
  other: 'Otro',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

const AIAS_BY_NUMBER: Record<number, string> = {
  1: '1: No IA',
  2: '2: Planeación',
  3: '3: Colaboración',
  4: '4: Uso pleno',
  5: '5: Exploración',
};

const AIAS_BY_KEY: Record<string, string> = {
  nivel_1: '1: No IA',
  nivel_2: '2: Planeación',
  nivel_3: '3: Colaboración',
  nivel_4: '4: Uso pleno',
  nivel_5: '5: Exploración',
};

export function getResourceTypeLabel(type?: string | null): string {
  if (!type?.trim()) return 'Recurso';
  const raw = type.trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  if (TYPE_LABELS[normalized]) return TYPE_LABELS[normalized];
  if (TYPE_LABELS[raw]) return TYPE_LABELS[raw];
  if (TYPE_LABELS[raw.toUpperCase()]) return TYPE_LABELS[raw.toUpperCase()];
  return raw.replace(/_/g, ' ');
}

export function getExperienceLevelLabel(level?: string | null): string {
  if (!level?.trim()) return '';
  const key = level.trim().toLowerCase().replace(/\s+/g, '_');
  if (LEVEL_LABELS[key]) return LEVEL_LABELS[key];
  if (key.includes('princip')) return 'Principiante';
  if (key.includes('inter')) return 'Intermedio';
  if (key.includes('avan')) return 'Avanzado';
  return level.replace(/_/g, ' ');
}

export function parseAiasLevel(value: unknown): number | undefined {
  if (typeof value === 'number' && value >= 1 && value <= 5) return value;
  if (typeof value === 'string' && value.trim()) {
    const m = value.match(/nivel_?(\d)|^(\d)$/i);
    if (m) {
      const n = parseInt(m[1] ?? m[2], 10);
      if (n >= 1 && n <= 5) return n;
    }
    const n = parseInt(value, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 5) return n;
  }
  return undefined;
}

export function getAiasLevelLabel(value: unknown): string | null {
  const n = parseAiasLevel(value);
  if (n != null) return AIAS_BY_NUMBER[n] ?? `Nivel ${n}`;
  if (typeof value === 'string' && value.trim()) {
    const key = value.trim().toLowerCase();
    return AIAS_BY_KEY[key] ?? null;
  }
  return null;
}

export function getActivityTypeLabel(activity?: string | null): string | null {
  if (!activity?.trim()) return null;
  const raw = activity.trim();
  const asType = getResourceTypeLabel(raw);
  if (asType !== raw.replace(/_/g, ' ') && asType !== 'Recurso') return asType;
  return raw;
}

export function getCategoryLabel(category?: string | null): string {
  if (!category?.trim()) return '';
  const raw = category.trim();
  const key = raw.toLowerCase();
  const map: Record<string, string> = {
    documento: 'Documento',
    guia: 'Guía',
    guías: 'Guía',
    plantilla: 'Plantilla',
    video: 'Video',
    recurso: 'Recurso',
  };
  return map[key] ?? raw;
}

export function getRoleLabel(role?: string | null): string {
  if (role === 'professor') return 'Docente';
  if (role === 'department_head') return 'Jefe de departamento';
  return role ?? '';
}
