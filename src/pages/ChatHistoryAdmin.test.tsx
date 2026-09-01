import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHistoryAdmin } from './ChatHistoryAdmin';
import * as apiModule from '../services/api';

const authState = vi.hoisted(() => ({
  user: {
    id: 'jefe-1',
    name: 'Jefe',
    email: 'jefe@maia.com',
    role: 'department_head' as const,
    department: 'Ing',
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, isLoading: false }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('ChatHistoryAdmin', () => {
  beforeEach(() => {
    authState.user = {
      id: 'jefe-1',
      name: 'Jefe',
      email: 'jefe@maia.com',
      role: 'department_head',
      department: 'Ing',
    };
    vi.restoreAllMocks();
    vi.spyOn(apiModule.chatAPI, 'getUserInteractionsByEmail').mockResolvedValue({
      content: [
        {
          id: 'i1',
          conversationId: 'c1',
          userId: 'u1',
          question: '¿Cómo usar IA?',
          answer: 'Respuesta',
          sequenceNumber: 1,
          createdAt: '2026-05-01T10:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    });
  });

  it('bloquea acceso si el rol no es department_head', () => {
    authState.user = {
      id: 'p1',
      name: 'Prof',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ing',
    };

    render(<ChatHistoryAdmin />);

    expect(screen.getByText(/Acceso restringido/i)).toBeInTheDocument();
  });

  it('renderiza formulario para jefe y carga historial por correo', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryAdmin />);

    expect(
      screen.getByText(/Historial de Interacciones por Usuario/i),
    ).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Correo del usuario/i);
    await user.type(emailInput, 'docente@maia.com');

    const applyBtn = screen.getByRole('button', { name: /Aplicar filtros/i });
    await user.click(applyBtn);

    await waitFor(() => {
      expect(apiModule.chatAPI.getUserInteractionsByEmail).toHaveBeenCalledWith(
        'docente@maia.com',
        expect.objectContaining({ page: 0, size: 10 }),
      );
    });

    expect(await screen.findByText(/¿Cómo usar IA\?/i)).toBeInTheDocument();
  });

  it('limpiar filtros vacía el estado', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryAdmin />);

    await user.type(screen.getByLabelText(/Correo del usuario/i), 'docente@maia.com');
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));
    await screen.findByText(/¿Cómo usar IA\?/i);

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    expect(screen.queryByText(/¿Cómo usar IA\?/i)).not.toBeInTheDocument();
  });

  it('navega a la página siguiente cuando hay más resultados', async () => {
    vi.spyOn(apiModule.chatAPI, 'getUserInteractionsByEmail')
      .mockResolvedValueOnce({
        content: [
          {
            id: 'i1',
            conversationId: 'c1',
            userId: 'u1',
            question: 'Q1',
            answer: 'A1',
            sequenceNumber: 1,
            createdAt: '2026-05-01T10:00:00',
          },
        ],
        totalElements: 15,
        totalPages: 2,
        size: 10,
        number: 0,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 'i2',
            conversationId: 'c2',
            userId: 'u1',
            question: 'Q2',
            answer: 'A2',
            sequenceNumber: 1,
            createdAt: '2026-05-02T10:00:00',
          },
        ],
        totalElements: 15,
        totalPages: 2,
        size: 10,
        number: 1,
      });

    const user = userEvent.setup();
    render(<ChatHistoryAdmin />);
    await user.type(screen.getByLabelText(/Correo del usuario/i), 'docente@maia.com');
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));
    await screen.findByText(/Q1/);

    await user.click(screen.getByRole('link', { name: /Go to next page/i }));

    await waitFor(() => {
      expect(apiModule.chatAPI.getUserInteractionsByEmail).toHaveBeenLastCalledWith(
        'docente@maia.com',
        expect.objectContaining({ page: 1 }),
      );
    });
    expect(await screen.findByText(/Q2/)).toBeInTheDocument();
  });

  it('muestra error si la API falla', async () => {
    vi.mocked(apiModule.chatAPI.getUserInteractionsByEmail).mockReset();
    vi.mocked(apiModule.chatAPI.getUserInteractionsByEmail).mockRejectedValue(
      new Error('Usuario no encontrado'),
    );

    render(<ChatHistoryAdmin />);
    fireEvent.change(screen.getByLabelText(/Correo del usuario/i), {
      target: { value: 'noexiste@maia.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    expect(await screen.findByText(/Usuario no encontrado/i)).toBeInTheDocument();
  });

  it('no consulta API si el correo está vacío', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryAdmin />);

    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    expect(apiModule.chatAPI.getUserInteractionsByEmail).not.toHaveBeenCalled();
    expect(screen.queryByText(/¿Cómo usar IA\?/i)).not.toBeInTheDocument();
  });

  it('aplica filtro de fechas al buscar por correo', async () => {
    const user = userEvent.setup();
    render(<ChatHistoryAdmin />);

    await user.type(screen.getByLabelText(/Correo del usuario/i), 'Docente@MAIA.COM');
    await user.type(screen.getByLabelText(/Desde/i), '2026-04-01');
    await user.type(screen.getByLabelText(/Hasta/i), '2026-04-30');
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    await waitFor(() => {
      expect(apiModule.chatAPI.getUserInteractionsByEmail).toHaveBeenCalledWith(
        'docente@maia.com',
        expect.objectContaining({
          fromDate: '2026-04-01T00:00:00',
          toDate: '2026-04-30T23:59:59.999999999',
        }),
      );
    });
  });
});
