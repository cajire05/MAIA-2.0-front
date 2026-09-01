import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Notifications } from './Notifications';
import { notificationsAPI, supportRequestsAPI } from '../services/api';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/notifications', search: '', hash: '', state: null, key: 'default' }),
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: 'professor', name: 'Danna', email: 'danna@maia.com' },
  }),
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return {
    ...actual,
    notificationsAPI: {
      getAll: vi.fn(),
      markAsRead: vi.fn(),
      markAsUnread: vi.fn(),
      markAllAsRead: vi.fn(),
      getUnreadCount: vi.fn(),
    },
    supportRequestsAPI: {
      getById: vi.fn(),
      getAll: vi.fn(),
      getStats: vi.fn(),
      respond: vi.fn(),
      create: vi.fn(),
      getMyRequests: vi.fn(),
    },
  };
});

vi.mock('../components/RequestDetailDialog', () => ({
  RequestDetailDialog: ({
    open,
    requestId,
  }: {
    open: boolean;
    requestId: string | null;
  }) =>
    open ? (
      <div data-testid="request-detail-dialog">Detalle solicitud {requestId}</div>
    ) : null,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationsAPI.getAll).mockResolvedValue([
      {
        id: 'n-1',
        userId: 'user-1',
        title: 'Tu solicitud fue respondida',
        message: 'El jefe respondió',
        type: 'REQUEST_RESPONDED',
        isRead: false,
        requestId: 'req-99',
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(notificationsAPI.markAsRead).mockResolvedValue(undefined);
    vi.mocked(supportRequestsAPI.getById).mockResolvedValue({
      id: 'req-99',
      requesterName: 'Danna',
      title: 'Prueba',
      description: 'Desc',
      priority: 'MEDIA',
      status: 'CONTESTADA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseText: 'Listo',
    });
  });

  it('abre el modal de detalle al hacer clic sin navegar a support', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tu solicitud fue respondida')).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Ver solicitud/i));

    await waitFor(() => {
      expect(screen.getByTestId('request-detail-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Detalle solicitud req-99/i)).toBeInTheDocument();
    });

    expect(notificationsAPI.markAsRead).toHaveBeenCalledWith('n-1');
    expect(supportRequestsAPI.getById).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('redirige a encuestas al hacer clic en notificación de encuesta', async () => {
    navigateMock.mockClear();
    vi.mocked(notificationsAPI.getAll).mockResolvedValue([
      {
        id: 'n-survey',
        userId: 'user-1',
        title: 'Nueva encuesta de satisfacción',
        message: 'Tienes una nueva encuesta',
        type: 'SURVEY_AVAILABLE',
        isRead: false,
        requestId: 'inv-42',
        createdAt: new Date().toISOString(),
      },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nueva encuesta de satisfacción')).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Responder encuesta/i));

    expect(navigateMock).toHaveBeenCalledWith('/surveys?invitationId=inv-42');
    expect(screen.queryByTestId('request-detail-dialog')).not.toBeInTheDocument();
  });

  it('marca todas como leídas', async () => {
    vi.mocked(notificationsAPI.markAllAsRead).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Marcar todas como leídas/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Marcar todas como leídas/i }));

    await waitFor(() => {
      expect(notificationsAPI.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  it('alterna leída y no leída desde el botón de campana', async () => {
    vi.mocked(notificationsAPI.markAsUnread).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Tu solicitud fue respondida')).toBeInTheDocument());

    const toggleBtn = screen.getByTitle('Marcar como leída');
    await user.click(toggleBtn);

    await waitFor(() => {
      expect(notificationsAPI.markAsRead).toHaveBeenCalledWith('n-1');
    });

    await user.click(screen.getByTitle('Marcar como no leída'));
    await waitFor(() => {
      expect(notificationsAPI.markAsUnread).toHaveBeenCalledWith('n-1');
    });
  });

  it('muestra estado vacío sin notificaciones', async () => {
    vi.mocked(notificationsAPI.getAll).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Sin notificaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Estás al día/i)).toBeInTheDocument();
  });
});
