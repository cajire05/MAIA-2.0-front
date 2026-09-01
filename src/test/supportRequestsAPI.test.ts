import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supportRequestsAPI } from '../services/api';

const originalFetch = global.fetch;

describe('supportRequestsAPI', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      clear: vi.fn(),
      key: vi.fn(() => null),
    } satisfies Storage);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('getAll with CONTESTADA status calls correct endpoint', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify([])),
    });

    await supportRequestsAPI.getAll(undefined, 'CONTESTADA');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/requests?status=CONTESTADA',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token',
        }),
      }),
    );
  });

  it('getStats returns recibidas and contestadas', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({ recibidas: 2, contestadas: 5 })),
    });

    const stats = await supportRequestsAPI.getStats();

    expect(stats).toEqual({ recibidas: 2, contestadas: 5 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/requests/stats'),
      expect.any(Object),
    );
  });

  it('respond sends only responseText without status field', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });

    await supportRequestsAPI.respond('req-1', { responseText: '  Mi respuesta  ' });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual({
      responseText: '  Mi respuesta  ',
    });
  });

  it('admin.getAll calls admin endpoint with status and department', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify([])),
    });

    await supportRequestsAPI.admin.getAll('RECIBIDA', 'dept-1');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/requests?status=RECIBIDA&departmentId=dept-1',
      expect.any(Object),
    );
  });

  it('admin.getStats without filter calls stats endpoint', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ recibidas: 0, contestadas: 0 })),
    });

    await supportRequestsAPI.admin.getStats();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/requests/stats',
      expect.any(Object),
    );
  });
});
