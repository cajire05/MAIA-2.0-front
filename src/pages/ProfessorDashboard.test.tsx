import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfessorDashboard } from './ProfessorDashboard';
import { ChatProvider } from '../contexts/ChatContext';
import * as api from '../services/api';

const mockNavigate = vi.fn();
const openChat = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'Danna Lopez',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ing',
    },
  }),
}));

describe('ProfessorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.resourcesAPI, 'getAll').mockResolvedValue([
      { id: 'r1', title: 'Guía IA', description: 'd', type: 'guide', createdAt: new Date().toISOString() },
    ]);
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([
      { id: 'req-1', title: 'Ayuda', priority: 'ALTA', status: 'RECIBIDA', createdAt: new Date().toISOString() },
    ]);
  });

  it('muestra bienvenida y acciones rápidas', async () => {
    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Bienvenido, Danna/i)).toBeInTheDocument();
    expect(screen.getByText('Guía IA')).toBeInTheDocument();
    expect(screen.getByText('Ayuda')).toBeInTheDocument();
  });

  it('abre chat y navega a biblioteca', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    await screen.findByText(/Bienvenido/i);
    await user.click(screen.getByRole('button', { name: /Iniciar Chat IA/i }));
    await user.click(screen.getByRole('button', { name: /Explorar Biblioteca/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/library');
  });

  it('muestra estado vacío de recursos y navega a apoyo', async () => {
    vi.spyOn(api.resourcesAPI, 'getAll').mockResolvedValue([]);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/No hay recursos en la biblioteca/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Solicitar Apoyo/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/support');
  });

  it('muestra solicitud contestada en el panel', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([
      {
        id: 'req-ok',
        title: 'Resuelta',
        priority: 'MEDIA',
        status: 'CONTESTADA',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Resuelta')).toBeInTheDocument();
  });

  it('tolera fallo al cargar recursos y solicitudes', async () => {
    vi.spyOn(api.resourcesAPI, 'getAll').mockRejectedValue(new Error('offline'));
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockRejectedValue(new Error('offline'));

    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/No hay recursos en la biblioteca/i)).toBeInTheDocument();
    expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();
  });

  it('muestra etiquetas de prioridad en solicitudes', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([
      { id: 'r1', title: 'Urgente', priority: 'ALTA', status: 'RECIBIDA', createdAt: new Date().toISOString() },
      { id: 'r2', title: 'Normal', priority: 'MEDIA', status: 'RECIBIDA', createdAt: new Date().toISOString() },
      { id: 'r3', title: 'Baja prio', priority: 'BAJA', status: 'CONTESTADA', createdAt: new Date().toISOString() },
    ]);

    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Urgente')).toBeInTheDocument();
    expect(screen.getByText('Baja prio')).toBeInTheDocument();
  });

  it('navega al hacer clic en recurso reciente y botones del panel', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    await screen.findByText('Guía IA');
    await user.click(screen.getByText('Guía IA'));
    expect(mockNavigate).toHaveBeenCalledWith('/library');

    await user.click(screen.getByRole('button', { name: /Ver Todos/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/library');

    await user.click(screen.getByRole('button', { name: /Nueva Solicitud/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/support');
  });

  it('muestra panel vacío de solicitudes de apoyo', async () => {
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ChatProvider>
          <ProfessorDashboard />
        </ChatProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/No tienes solicitudes de apoyo aún/i)).toBeInTheDocument();
  });
});
