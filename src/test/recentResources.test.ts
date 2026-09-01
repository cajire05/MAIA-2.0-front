import { describe, it, expect } from 'vitest';
import {
  pickRecentLibraryResources,
  getLevelLabel,
  sortResourcesByNewestFirst,
} from '../utils/recentResources';

describe('recentResources utils', () => {
  it('pickRecentLibraryResources returns latest items', () => {
    const now = Date.now();
    const items = [
      { id: '1', title: 'Old', createdAt: new Date(now - 7200000).toISOString() },
      { id: '2', title: 'New', createdAt: new Date(now - 1000).toISOString() },
    ];

    const recent = pickRecentLibraryResources(items, 1);
    expect(recent).toHaveLength(1);
    expect(recent[0].title).toBe('New');
  });

  it('pickRecentLibraryResources maps missing fields with defaults', () => {
    const recent = pickRecentLibraryResources([{ id: 'x' }], 3);
    expect(recent[0].title).toBe('Recurso sin título');
    expect(recent[0].type).toBe('guide');
  });

  it('getLevelLabel translates known levels', () => {
    expect(getLevelLabel('beginner')).toBe('Principiante');
    expect(getLevelLabel('custom_level')).toBe('custom level');
  });

  it('getLevelLabel traduce intermedio y avanzado', () => {
    expect(getLevelLabel('intermediate')).toBe('Intermedio');
    expect(getLevelLabel('advanced')).toBe('Avanzado');
  });

  it('pickRecentLibraryResources devuelve arreglo vacío sin ítems', () => {
    expect(pickRecentLibraryResources([], 3)).toEqual([]);
    expect(pickRecentLibraryResources(null as unknown as unknown[], 3)).toEqual([]);
  });

  it('pickRecentLibraryResources prioriza recursos de la última hora', () => {
    const now = Date.now();
    const items = [
      { id: 'old', title: 'Antiguo', createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
      { id: 'fresh', title: 'Reciente', createdAt: new Date(now - 5 * 60 * 1000).toISOString() },
    ];
    const recent = pickRecentLibraryResources(items, 2);
    expect(recent).toHaveLength(1);
    expect(recent[0].title).toBe('Reciente');
  });

  it('sortResourcesByNewestFirst ordena del más reciente al más antiguo', () => {
    const now = Date.now();
    const sorted = sortResourcesByNewestFirst([
      { id: '1', dateAdded: new Date(now - 5000).toISOString() },
      { id: '2', dateAdded: new Date(now - 1000).toISOString() },
      { id: '3', createdAt: new Date(now - 2000).toISOString() },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(['2', '3', '1']);
  });

  it('pickRecentLibraryResources usa dateAdded si no hay createdAt', () => {
    const now = Date.now();
    const recent = pickRecentLibraryResources(
      [{ id: 'd', title: 'Con dateAdded', dateAdded: new Date(now - 1000).toISOString() }],
      1,
    );
    expect(recent[0].title).toBe('Con dateAdded');
  });
});
