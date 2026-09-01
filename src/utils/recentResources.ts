import {
  getExperienceLevelLabel,
  getResourceTypeLabel,
  parseAiasLevel,
} from './resourceLabels';

export interface DashboardResource {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  category?: string;
  activityType?: string;
  aiasLevel?: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

function parseResourceDate(item: Record<string, unknown>): number {
  const raw = item.createdAt ?? item.dateAdded;
  if (!raw) return 0;
  const ts = new Date(String(raw)).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/** Marca de tiempo para ordenar (createdAt o dateAdded). */
export function getResourceTimestamp(item: {
  dateAdded?: string;
  createdAt?: string;
}): number {
  return parseResourceDate(item as Record<string, unknown>);
}

/** Orden descendente: más recientes primero. */
export function sortResourcesByNewestFirst<T extends { dateAdded?: string; createdAt?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => getResourceTimestamp(b) - getResourceTimestamp(a));
}

function mapApiResource(item: Record<string, unknown>): DashboardResource {
  const type = String(item.type ?? 'guide');
  const level = String(item.aiUseLevel ?? item.level ?? 'beginner');
  const activityRaw = item.activityType ?? item.activity;
  return {
    id: String(item.id),
    title: String(item.title ?? 'Recurso sin título'),
    description: String(item.description ?? ''),
    type,
    level,
    category: item.category != null ? String(item.category) : undefined,
    activityType: activityRaw != null ? String(activityRaw) : undefined,
    aiasLevel: parseAiasLevel(item.aiasLevel),
  };
}

/** Últimos N de la última hora; si no hay, los N más recientes por fecha de creación. */
export function pickRecentLibraryResources(
  items: unknown[],
  limit = 3,
): DashboardResource[] {
  const normalized = (Array.isArray(items) ? items : []).map((item) => ({
    item: item as Record<string, unknown>,
    ts: parseResourceDate(item as Record<string, unknown>),
  }));

  const sorted = [...normalized].sort((a, b) => b.ts - a.ts);
  const cutoff = Date.now() - ONE_HOUR_MS;
  const lastHour = sorted.filter(({ ts }) => ts > 0 && ts >= cutoff);
  const source = lastHour.length > 0 ? lastHour : sorted;

  return source.slice(0, limit).map(({ item }) => mapApiResource(item));
}

/** @deprecated Use getExperienceLevelLabel from resourceLabels */
export function getLevelLabel(level: string): string {
  return getExperienceLevelLabel(level) || level;
}

export { getResourceTypeLabel, getExperienceLevelLabel };
