export const NOTIFICATIONS_CHANGED_EVENT = 'maia:notifications-changed';

export function dispatchNotificationsChanged(): void {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
}
