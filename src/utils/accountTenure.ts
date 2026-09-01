/** Convierte createdAt del backend (string ISO, array Jackson, timestamp). */
export function normalizeCreatedAt(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0, nano = 0] = value as number[];
    const ms = Math.floor(Number(nano) / 1_000_000);
    return new Date(Date.UTC(y, m - 1, d, h, min, s, ms)).toISOString();
  }
  return undefined;
}

/** Días en la plataforma desde la creación de la cuenta (día de registro = 1). */
export function getDaysOnPlatform(createdAt?: unknown): number | null {
  const raw = normalizeCreatedAt(createdAt);
  if (!raw) return null;
  const created = new Date(raw);
  if (Number.isNaN(created.getTime())) return null;

  const startDay = Date.UTC(
    created.getUTCFullYear(),
    created.getUTCMonth(),
    created.getUTCDate(),
  );
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const elapsed = Math.floor((today - startDay) / 86_400_000) + 1;
  return Math.max(1, elapsed);
}
