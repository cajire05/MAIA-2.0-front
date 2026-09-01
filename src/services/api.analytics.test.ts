import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyticsAPI } from './api';

const originalFetch = global.fetch;

describe('analyticsAPI', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as Storage);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockOkResponse = (body: unknown) =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(body)),
    });

  // ---- getDashboard ----

  it('getDashboard envía GET a /api/analytics/dashboard con el período indicado', async () => {
    let requestedUrl = '';
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      requestedUrl = url;
      return mockOkResponse({ totalUsers: 10, activeUsers: 7, chatInteractions: 50,
        conversations: 12, requestsRecibidas: 2, requestsEnProceso: 1, requestsResueltas: 8 });
    });

    await analyticsAPI.getDashboard('MONTH');

    expect(requestedUrl).toContain('/api/analytics/dashboard');
    expect(requestedUrl).toContain('period=MONTH');
  });

  it('getDashboard usa MONTH como período por defecto', async () => {
    let requestedUrl = '';
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      requestedUrl = url;
      return mockOkResponse({});
    });

    await analyticsAPI.getDashboard();

    expect(requestedUrl).toContain('period=MONTH');
  });

  // ---- getUsage ----

  it('getUsage envía GET a /api/analytics/usage con el período indicado', async () => {
    let requestedUrl = '';
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      requestedUrl = url;
      return mockOkResponse({ period: 'WEEK', dataPoints: [] });
    });

    await analyticsAPI.getUsage('WEEK');

    expect(requestedUrl).toContain('/api/analytics/usage');
    expect(requestedUrl).toContain('period=WEEK');
  });

  it('getUsage usa MONTH como período por defecto', async () => {
    let requestedUrl = '';
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      requestedUrl = url;
      return mockOkResponse({ period: 'MONTH', dataPoints: [] });
    });

    await analyticsAPI.getUsage();

    expect(requestedUrl).toContain('period=MONTH');
  });

  // ---- getTopics ----

  it('getTopics incluye period y limit en la URL', async () => {
    let requestedUrl = '';
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      requestedUrl = url;
      return mockOkResponse([]);
    });

    await analyticsAPI.getTopics('QUARTER', 5);

    expect(requestedUrl).toContain('/api/analytics/topics');
    expect(requestedUrl).toContain('period=QUARTER');
    expect(requestedUrl).toContain('limit=5');
  });

  it('getTopics usa valores por defecto cuando no se pasan argumentos', async () => {
    let requestedUrl = '';
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      requestedUrl = url;
      return mockOkResponse([]);
    });

    await analyticsAPI.getTopics();

    expect(requestedUrl).toContain('period=MONTH');
    expect(requestedUrl).toContain('limit=10');
  });
});
