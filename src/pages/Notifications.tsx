import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RequestDetailDialog } from '../components/RequestDetailDialog';
import { Bell, BellOff, CheckCheck, ClipboardList, Loader2, MessageSquare } from 'lucide-react';
import { notificationsAPI, isSurveyNotification, type NotificationDTO } from '../services/api';
import { dispatchNotificationsChanged } from '../utils/notificationEvents';
import { toast } from 'sonner';

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async (options?: { silent?: boolean }) => {
    if (!user?.id) return;
    const silent = options?.silent ?? false;
    try {
      if (!silent) setIsLoading(true);
      const data = await notificationsAPI.getAll(user.id);
      setNotifications(data);
    } catch {
      if (!silent) toast.error('Error al cargar las notificaciones');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (location.pathname === '/notifications') {
      void fetchNotifications({ silent: true });
    }
  }, [location.pathname, fetchNotifications]);

  const handleToggleRead = async (notification: NotificationDTO) => {
    setTogglingId(notification.id);
    try {
      if (notification.isRead) {
        await notificationsAPI.markAsUnread(notification.id);
      } else {
        await notificationsAPI.markAsRead(notification.id);
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: !n.isRead } : n
        )
      );
      dispatchNotificationsChanged();
    } catch {
      toast.error('Error al actualizar la notificación');
    } finally {
      setTogglingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    dispatchNotificationsChanged();
    try {
      await notificationsAPI.markAllAsRead(user.id);
      toast.success('Todas las notificaciones marcadas como leídas');
      dispatchNotificationsChanged();
    } catch {
      toast.error('Error al marcar las notificaciones');
      void fetchNotifications({ silent: true });
      dispatchNotificationsChanged();
    } finally {
      setMarkingAll(false);
    }
  };

  const markNotificationRead = (notification: NotificationDTO) => {
    if (!notification.isRead) {
      notificationsAPI.markAsRead(notification.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      dispatchNotificationsChanged();
    }
  };

  const handleNotificationClick = (notification: NotificationDTO) => {
    markNotificationRead(notification);

    if (isSurveyNotification(notification.type)) {
      const params = notification.requestId
        ? `?invitationId=${encodeURIComponent(notification.requestId)}`
        : '';
      navigate(`/surveys${params}`);
      return;
    }

    if (notification.requestId && notification.type === 'REQUEST_RESPONDED') {
      setDetailRequestId(notification.requestId);
      setDetailDialogOpen(true);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
              : 'Estás al día con todas tus notificaciones'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="gap-2"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#5454e9]" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">Sin notificaciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aquí aparecerán las respuestas a tus solicitudes de apoyo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                notification.isRead
                  ? 'border-[#f5f7fb] bg-white'
                  : 'border-[#5454e9]/20 bg-[#eef2ff]'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 rounded-full p-2 mt-0.5 ${
                      notification.isRead ? 'bg-gray-100' : 'bg-[#5454e9]/10'
                    }`}
                  >
                    {isSurveyNotification(notification.type) ? (
                      <ClipboardList
                        className={`h-4 w-4 ${
                          notification.isRead ? 'text-gray-400' : 'text-[#5454e9]'
                        }`}
                      />
                    ) : (
                      <MessageSquare
                        className={`h-4 w-4 ${
                          notification.isRead ? 'text-gray-400' : 'text-[#5454e9]'
                        }`}
                      />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`text-sm font-semibold ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#5454e9] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {notification.message}
                    </p>
                    {isSurveyNotification(notification.type) ? (
                      <p className="text-xs text-[#5454e9] mt-2 font-medium">
                        Responder encuesta →
                      </p>
                    ) : notification.requestId && notification.type === 'REQUEST_RESPONDED' ? (
                      <p className="text-xs text-[#5454e9] mt-2 font-medium">
                        Ver solicitud →
                      </p>
                    ) : null}
                  </div>

                  {/* Toggle read button */}
                  <button
                    type="button"
                    title={notification.isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRead(notification);
                    }}
                    disabled={togglingId === notification.id}
                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {togglingId === notification.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : notification.isRead ? (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-[#5454e9]" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RequestDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) setDetailRequestId(null);
        }}
        requestId={detailDialogOpen ? detailRequestId : null}
      />
    </div>
  );
}
