import type { User } from '../contexts/AuthContext';

export const EXPERIENCE_LEVEL_TO_BACKEND: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const BACKEND_TO_EXPERIENCE: Record<string, User['experienceLevel']> = {
  principiante: 'beginner',
  beginner: 'beginner',
  intermedio: 'intermediate',
  intermediate: 'intermediate',
  avanzado: 'advanced',
  advanced: 'advanced',
};

export function mapBackendExperienceLevel(
  value?: string | null,
): User['experienceLevel'] | undefined {
  if (!value?.trim()) return undefined;
  const key = value.trim().toLowerCase();
  return BACKEND_TO_EXPERIENCE[key];
}

/** Etiqueta en español para mostrar en la UI (p. ej. beginner → Principiante). */
export function getExperienceLevelLabel(
  level?: User['experienceLevel'] | string | null,
): string {
  if (!level?.trim()) return '';
  const normalized = mapBackendExperienceLevel(level) ?? level;
  if (normalized in EXPERIENCE_LEVEL_TO_BACKEND) {
    return EXPERIENCE_LEVEL_TO_BACKEND[normalized];
  }
  return level.trim();
}

export function isProfileSetupComplete(user: User | null): boolean {
  if (!user) return false;
  const dept = user.department?.trim();
  if (!dept) return false;
  if (user.role === 'department_head') return true;
  const area = user.academicArea?.trim();
  const level = user.experienceLevel;
  return Boolean(area && level);
}
