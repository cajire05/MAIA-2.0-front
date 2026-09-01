import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestManagement } from './RequestManagement';
import { supportRequestsAPI } from '../services/api';

const authState = vi.hoisted(() => ({
  user: {
    id: 'jefe-1',
    role: 'department_head' as const,
    name: 'Jefe',
    email: 'jefe@maia.com',
    isAdministrator: false,
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return {
    ...actual,
    departmentsAPI: {
      getAll: vi.fn().mockResolvedValue([{ id: 'dept-1', name: 'Ing' }]),
    },
    supportRequestsAPI: {
      getAll: vi.fn(),
      getStats: vi.fn(),
      getById: vi.fn(),
      respond: vi.fn(),
      create: vi.fn(),
      getMyRequests: vi.fn(),
      admin: {
        getAll: vi.fn(),
        getStats: vi.fn(),
      },
    },
  };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('RequestManagement', () => {
  beforeEach(() => {
    authState.user = {
      id: 'jefe-1',
      role: 'department_head',
      name: 'Jefe',
      email: 'jefe@maia.com',
      isAdministrator: false,
    };
    vi.clearAllMocks();
    vi.mocked(supportRequestsAPI.getStats).mockResolvedValue({
      recibidas: 1,
      contestadas: 2,
    });
    vi.mocked(supportRequestsAPI.getAll).mockResolvedValue([
      {
        id: 'req-1',
        requesterName: 'Danna Lopez',
        title: 'Prueba',
        priority: 'MEDIA',
        status: 'RECIBIDA',
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  it('muestra error si falla la carga de la lista', async () => {
    const { toast } = await import('sonner');
    vi.mocked(supportRequestsAPI.getAll).mockRejectedValue(new Error('Lista falló'));
    render(<RequestManagement />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al cargar las solicitudes');
    });
  });

  it('muestra contadores de recibidas y contestadas desde el API', async () => {
    render(<RequestManagement />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    expect(screen.getByText(/Recibidas \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Contestadas \(2\)/i)).toBeInTheDocument();
  });

  it('al cambiar a contestadas consulta status CONTESTADA', async () => {
    vi.mocked(supportRequestsAPI.getAll).mockImplementation(async (_id, status) => {
      if (status === 'CONTESTADA') {
        return [
          {
            id: 'req-2',
            requesterName: 'Docente',
            title: 'Ya contestada',
            priority: 'BAJA',
            status: 'CONTESTADA',
            createdAt: new Date().toISOString(),
          },
        ];
      }
      return [];
    });

    const user = userEvent.setup();
    render(<RequestManagement />);

    await waitFor(() => expect(screen.getByText(/Recibidas \(1\)/i)).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Contestadas/i }));

    await waitFor(() => {
      expect(screen.getByText('Ya contestada')).toBeInTheDocument();
    });

    expect(supportRequestsAPI.getAll).toHaveBeenCalledWith(undefined, 'CONTESTADA');
  });

  it('modo admin usa API admin y filtro de departamento', async () => {
    authState.user.isAdministrator = true;
    vi.mocked(supportRequestsAPI.admin.getAll).mockResolvedValue([]);
    vi.mocked(supportRequestsAPI.admin.getStats).mockResolvedValue({
      recibidas: 5,
      contestadas: 2,
    });

    const user = userEvent.setup();
    render(<RequestManagement />);

    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(supportRequestsAPI.admin.getStats).toHaveBeenCalled();

    await user.click(screen.getByTestId('select-dept-1'));
    await waitFor(() => {
      expect(supportRequestsAPI.admin.getAll).toHaveBeenCalledWith('RECIBIDA', 'dept-1');
    });
  });

  it('abre solicitud y envía respuesta', async () => {
    vi.mocked(supportRequestsAPI.respond).mockResolvedValue(undefined);
    vi.mocked(supportRequestsAPI.getById).mockResolvedValue({
      id: 'req-1',
      requesterName: 'Danna Lopez',
      title: 'Prueba',
      description: 'Detalle',
      priority: 'MEDIA',
      status: 'RECIBIDA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<RequestManagement />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Responder/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Responder/i }));

    const textarea = await screen.findByLabelText(/Tu respuesta/i);
    await user.type(textarea, 'Respuesta del jefe');
    await user.click(screen.getByRole('button', { name: /Enviar respuesta/i }));

    await waitFor(() => {
      expect(supportRequestsAPI.respond).toHaveBeenCalledWith('req-1', {
        responseText: 'Respuesta del jefe',
      });
    });
  });
});
