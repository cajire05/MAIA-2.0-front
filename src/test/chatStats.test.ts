import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChatSessionCount } from '../utils/chatStats';
import { chatAPI } from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return {
    ...actual,
    chatAPI: {
      ...actual.chatAPI,
      getMyInteractions: vi.fn(),
    },
  };
});

describe('getChatSessionCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 when there are no interactions', async () => {
    vi.mocked(chatAPI.getMyInteractions).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 1,
      number: 0,
    });

    expect(await getChatSessionCount()).toBe(0);
    expect(chatAPI.getMyInteractions).toHaveBeenCalledTimes(1);
  });

  it('counts unique conversation ids across pages', async () => {
    vi.mocked(chatAPI.getMyInteractions).mockImplementation(async ({ page = 0, size = 10 } = {}) => {
      if (size === 1 && page === 0) {
        return {
          content: [{ id: '1', conversationId: 'c1', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' }],
          totalElements: 2,
          totalPages: 2,
          size: 1,
          number: 0,
        };
      }
      if (page === 0) {
        return {
          content: [{ id: '1', conversationId: 'c1', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' }],
          totalElements: 2,
          totalPages: 2,
          size: 100,
          number: 0,
        };
      }
      return {
        content: [{ id: '2', conversationId: 'c2', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' }],
        totalElements: 2,
        totalPages: 2,
        size: 100,
        number: 1,
      };
    });

    expect(await getChatSessionCount()).toBe(2);
  });

  it('ignora interacciones sin conversationId', async () => {
    vi.mocked(chatAPI.getMyInteractions).mockResolvedValue({
      content: [
        { id: '1', conversationId: '', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' },
        { id: '2', conversationId: 'c1', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 100,
      number: 0,
    });

    expect(await getChatSessionCount()).toBe(1);
  });

  it('cuenta conversaciones en una sola página', async () => {
    vi.mocked(chatAPI.getMyInteractions).mockImplementation(async ({ page = 0, size = 10 } = {}) => {
      if (size === 1 && page === 0) {
        return {
          content: [{ id: '1', conversationId: 'c1', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' }],
          totalElements: 1,
          totalPages: 1,
          size: 1,
          number: 0,
        };
      }
      return {
        content: [{ id: '1', conversationId: 'c1', userId: 'u', question: 'q', answer: 'a', sequenceNumber: 1, createdAt: '' }],
        totalElements: 1,
        totalPages: 1,
        size: 100,
        number: 0,
      };
    });

    expect(await getChatSessionCount()).toBe(1);
  });
});
