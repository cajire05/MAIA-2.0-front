import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chatAPI, type ChatInteraction, type Page } from './api';

const originalFetch = global.fetch;

describe('chatAPI', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.stubGlobal(
      'localStorage',
      {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as Storage,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('createInteraction envía POST a /api/chat/interactions', async () => {
    const mockInteraction: ChatInteraction = {
      id: '1',
      conversationId: 'conv-1',
      userId: 'user-1',
      question: '¿Hola?',
      answer: 'Hola',
      sequenceNumber: 1,
      createdAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockInteraction)),
    });

    const result = await chatAPI.createInteraction({ question: '¿Hola?' });
    expect(result).toEqual(mockInteraction);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat/interactions'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('getMyInteractions construye correctamente query params', async () => {
    const mockPage: Page<ChatInteraction> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    };

    let requestedUrl = '';

    (global.fetch as any).mockImplementation((url: string) => {
      requestedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockPage)),
      });
    });

    await chatAPI.getMyInteractions({
      conversationId: 'conv-1',
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      page: 2,
      size: 20,
    });

    expect(requestedUrl).toContain('/api/chat/interactions/me?');
    expect(requestedUrl).toContain('conversationId=conv-1');
    expect(requestedUrl).toContain('fromDate=2024-01-01');
    expect(requestedUrl).toContain('toDate=2024-01-31');
    expect(requestedUrl).toContain('page=2');
    expect(requestedUrl).toContain('size=20');
  });

  it('getUserInteractionsByEmail usa /user/by-email/{email}', async () => {
    const mockPage: Page<ChatInteraction> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    };

    let requestedUrl = '';

    (global.fetch as any).mockImplementation((url: string) => {
      requestedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockPage)),
      });
    });

    await chatAPI.getUserInteractionsByEmail('docente@maia.com', { page: 0, size: 10 });

    expect(requestedUrl).toContain('/api/chat/interactions/user/by-email/');
    expect(requestedUrl).toContain(encodeURIComponent('docente@maia.com'));
  });
});

