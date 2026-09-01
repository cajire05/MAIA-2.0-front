import { describe, it, expect, vi } from 'vitest';
import {
  NOTIFICATIONS_CHANGED_EVENT,
  dispatchNotificationsChanged,
} from '../utils/notificationEvents';

describe('notificationEvents', () => {
  it('expone el nombre del evento de notificaciones', () => {
    expect(NOTIFICATIONS_CHANGED_EVENT).toBe('maia:notifications-changed');
  });

  it('dispatchNotificationsChanged emite un CustomEvent en window', () => {
    const handler = vi.fn();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
    dispatchNotificationsChanged();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
  });
});
