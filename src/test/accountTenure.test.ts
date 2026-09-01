import { describe, expect, it } from 'vitest';
import { getDaysOnPlatform, normalizeCreatedAt } from '../utils/accountTenure';

describe('accountTenure', () => {
  it('cuenta el día de registro como día 1', () => {
    const today = new Date();
    const iso = today.toISOString();
    expect(getDaysOnPlatform(iso)).toBe(1);
  });

  it('devuelve null sin fecha válida', () => {
    expect(getDaysOnPlatform(undefined)).toBeNull();
    expect(getDaysOnPlatform('invalid')).toBeNull();
  });

  it('normalizeCreatedAt acepta array de Jackson (LocalDateTime)', () => {
    const today = new Date();
    const iso = normalizeCreatedAt([
      today.getUTCFullYear(),
      today.getUTCMonth() + 1,
      today.getUTCDate(),
    ]);
    expect(iso).toBeTruthy();
    expect(getDaysOnPlatform(iso)).toBe(1);
  });

  it('suma días calendario desde la creación', () => {
    const created = new Date();
    created.setUTCDate(created.getUTCDate() - 9);
    expect(getDaysOnPlatform(created.toISOString())).toBe(10);
  });
});
