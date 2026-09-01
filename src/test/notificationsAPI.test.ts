import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationsAPI, normalizeNotificationDTO } from '../services/api';

const originalFetch = global.fetch;

describe('notificationsAPI', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.stubGlobal(
      'localStorage',
      {
        getItem: vi.fn(() => 'fake-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        clear: vi.fn(),
        key: vi.fn(() => null),
      } satisfies Storage,
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('normalizeNotificationDTO maps legacy "read" field to isRead', () => {
    expect(
      normalizeNotificationDTO({
        id: 'n1',
        userId: 'u1',
        type: 'REQUEST_RESPONDED',
        title: 'T',
        message: 'M',
        isRead: false,
        read: true,
        createdAt: '',
      }),
    ).toMatchObject({ isRead: true });
  });

  it('getAll calls /api/notifications with encoded userId', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify([])),
    });

    await notificationsAPI.getAll('user-abc/1');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications?userId=' + encodeURIComponent('user-abc/1'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token',
        }),
      }),
    );
  });

  it('getUnreadCount returns count from JSON', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ count: 7 })),
    });

    const res = await notificationsAPI.getUnreadCount('u1');
    expect(res).toEqual({ count: 7 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/unread-count?userId='),
      expect.any(Object),
    );
  });

  it('markAsRead sends PUT to read endpoint', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    });

    await notificationsAPI.markAsRead('notif-99');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/' + encodeURIComponent('notif-99') + '/read',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('markAsUnread sends PUT to unread endpoint', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    });

    await notificationsAPI.markAsUnread('n-2');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/' + encodeURIComponent('n-2') + '/unread',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('markAllAsRead sends PUT with userId query', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    });

    await notificationsAPI.markAllAsRead('user-xyz');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/mark-all-read?userId=' + encodeURIComponent('user-xyz'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
