import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SupportRequest } from './SupportRequest';
import * as api from '../services/api';

vi.mock('../components/RequestDetailDialog', () => ({
  RequestDetailDialog: ({ open, requestId }: { open: boolean; requestId: string | null }) =>
    open ? <div data-testid="detail-dialog">Detalle {requestId}</div> : null,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Danna', email: 'danna@maia.com', role: 'professor', department: 'Ing' },
  }),
}));

describe('SupportRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.supportRequestsAPI, 'create').mockResolvedValue(undefined);
  });

  it('envía una nueva solicitud de apoyo', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([]);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportRequest />
      </MemoryRouter>,
    );

    await screen.findByText(/Apoyo Pedagógico/i);
    await user.type(screen.getByLabelText(/Asunto/i), 'Necesito ayuda');
    await user.type(screen.getByLabelText(/Descripción Detallada/i), 'Detalle de la solicitud');
    await user.type(screen.getByLabelText(/Teléfono de Contacto/i), '3001234567');
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }));

    await waitFor(() => {
      expect(api.supportRequestsAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterId: 'u1',
          title: 'Necesito ayuda',
        }),
      );
    });
  });

  it('lista solicitudes con distintas prioridades y abre detalle', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([
      {
        id: 'req-1',
        title: 'Pendiente',
        priority: 'ALTA',
        status: 'RECIBIDA',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'req-2',
        title: 'Contestada',
        priority: 'BAJA',
        status: 'CONTESTADA',
        createdAt: new Date().toISOString(),
      },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportRequest />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Ver Detalles/i }).length).toBe(2);
    });

    await user.click(screen.getAllByRole('button', { name: /Ver Detalles/i })[0]);
    expect(await screen.findByTestId('detail-dialog')).toHaveTextContent('req-1');
  });

  it('muestra error al cargar solicitudes anteriores', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockRejectedValue(new Error('Fallo carga'));
    render(
      <MemoryRouter>
        <SupportRequest />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al cargar tus solicitudes');
    });
  });

  it('muestra estado vacío de solicitudes anteriores', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([]);
    render(
      <MemoryRouter>
        <SupportRequest />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/No tienes solicitudes anteriores/i)).toBeInTheDocument();
  });

  it('muestra error si falla el envío', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.supportRequestsAPI, 'create').mockRejectedValue(new Error('Error de red'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupportRequest />
      </MemoryRouter>,
    );

    await screen.findByText(/Apoyo Pedagógico/i);
    await user.type(screen.getByLabelText(/Asunto/i), 'Ayuda');
    await user.type(screen.getByLabelText(/Descripción Detallada/i), 'Detalle largo');
    await user.type(screen.getByLabelText(/Teléfono de Contacto/i), '3001112233');
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error de red');
    });
  });

  it('abre detalle cuando hay requestId en la URL', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/support?requestId=req-99']}>
        <SupportRequest />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('detail-dialog')).toHaveTextContent('req-99');
  });
});
