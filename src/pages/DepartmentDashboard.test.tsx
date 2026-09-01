import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepartmentDashboard } from './DepartmentDashboard';
import * as apiModule from '../services/api';

const authState = vi.hoisted(() => ({
  user: {
    id: 'jefe-1',
    name: 'Jefe Test',
    role: 'department_head' as const,
    department: 'Ingeniería',
    isAdministrator: false,
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, isLoading: false }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockDashboard: apiModule.DepartmentDashboardDTO = {
  totalUsers: 12,
  activeUsers: 5,
  chatInteractions: 80,
  conversations: 20,
  requestsRecibidas: 3,
  requestsEnProceso: 1,
  requestsResueltas: 9,
};

const mockTopics: apiModule.TopicDTO[] = [
  { topic: 'curricular', count: 8 },
  { topic: 'aprendizaje', count: 5 },
];

const mockRequest: apiModule.RequestSummary = {
  id: 'req-1',
  requesterName: 'Docente Test',
  title: 'Necesito ayuda con IA',
  priority: 'ALTA',
  status: 'RECIBIDA',
  createdAt: '2026-05-01T10:00:00',
};

describe('DepartmentDashboard', () => {
  beforeEach(() => {
    authState.user = {
      id: 'jefe-1',
      name: 'Jefe Test',
      role: 'department_head',
      department: 'Ingeniería',
      isAdministrator: false,
    };
    vi.clearAllMocks();
    vi.spyOn(apiModule.analyticsAPI, 'getDashboard').mockResolvedValue(mockDashboard);
    vi.spyOn(apiModule.analyticsAPI, 'getTopics').mockResolvedValue(mockTopics);
    vi.spyOn(apiModule.supportRequestsAPI, 'getAll').mockResolvedValue([]);
    vi.spyOn(apiModule.supportRequestsAPI.admin, 'getAll').mockResolvedValue([]);
  });

  it('renderiza el título del dashboard', async () => {
    render(<DepartmentDashboard />);
    expect(await screen.findByText('Panorama del Departamento')).toBeInTheDocument();
  });

  it('consulta solicitudes recibidas para jefe de departamento', async () => {
    render(<DepartmentDashboard />);
    await screen.findByText('Panorama del Departamento');
    expect(apiModule.supportRequestsAPI.getAll).toHaveBeenCalledWith(undefined, 'RECIBIDA');
  });

  it('muestra los usuarios activos desde la API', async () => {
    render(<DepartmentDashboard />);
    const matches = await screen.findAllByText('5');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('muestra el total de profesores desde la API', async () => {
    render(<DepartmentDashboard />);
    expect(await screen.findByText('12')).toBeInTheDocument();
  });

  it('muestra temas frecuentes desde la API', async () => {
    render(<DepartmentDashboard />);
    expect(await screen.findByText(/curricular/i)).toBeInTheDocument();
    expect(await screen.findByText(/aprendizaje/i)).toBeInTheDocument();
  });

  it('muestra mensaje de sin solicitudes cuando la lista está vacía', async () => {
    render(<DepartmentDashboard />);
    expect(await screen.findByText(/Todo al día/i)).toBeInTheDocument();
  });

  it('muestra solicitudes pendientes cuando existen', async () => {
    vi.spyOn(apiModule.supportRequestsAPI, 'getAll').mockResolvedValue([
      mockRequest,
      {
        id: 'req-2',
        requesterName: 'Otro',
        title: 'Media prio',
        priority: 'MEDIA',
        status: 'RECIBIDA',
        departmentName: 'Ing',
        createdAt: '2026-05-02T10:00:00',
      },
      {
        id: 'req-3',
        requesterName: 'Tercero',
        title: 'Baja prio',
        priority: 'BAJA',
        status: 'RECIBIDA',
        createdAt: '2026-05-03T10:00:00',
      },
    ]);

    render(<DepartmentDashboard />);
    expect(await screen.findByText('Necesito ayuda con IA')).toBeInTheDocument();
    expect(screen.getByText('Ing')).toBeInTheDocument();
  });

  it('navega a solicitudes y analítica desde acciones rápidas', async () => {
    vi.spyOn(apiModule.supportRequestsAPI, 'getAll').mockResolvedValue([mockRequest]);
    const user = userEvent.setup();
    render(<DepartmentDashboard />);

    await screen.findByText('Necesito ayuda con IA');
    await user.click(screen.getByRole('button', { name: /Gestionar Solicitudes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/requests');

    await user.click(screen.getByRole('button', { name: /Ver Analítica/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics');
  });

  it('muestra mensaje de error cuando la API falla', async () => {
    vi.spyOn(apiModule.analyticsAPI, 'getDashboard').mockRejectedValue(
      new Error('Error al cargar datos'),
    );

    render(<DepartmentDashboard />);
    expect(await screen.findByText(/Error al cargar datos/i)).toBeInTheDocument();
  });
});

describe('DepartmentDashboard (administrador)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      id: 'admin-1',
      name: 'Admin',
      role: 'department_head',
      isAdministrator: true,
    };
    vi.spyOn(apiModule.analyticsAPI, 'getDashboard').mockResolvedValue(mockDashboard);
    vi.spyOn(apiModule.analyticsAPI, 'getTopics').mockResolvedValue(mockTopics);
    vi.spyOn(apiModule.supportRequestsAPI, 'getAll').mockResolvedValue([]);
    vi.spyOn(apiModule.supportRequestsAPI.admin, 'getAll').mockResolvedValue([mockRequest]);
  });

  it('renderiza panorama institucional y usa API admin de solicitudes', async () => {
    render(<DepartmentDashboard />);

    expect(await screen.findByText('Panorama institucional')).toBeInTheDocument();
    expect(apiModule.supportRequestsAPI.admin.getAll).toHaveBeenCalledWith('RECIBIDA');
    expect(apiModule.supportRequestsAPI.getAll).not.toHaveBeenCalled();
    expect(await screen.findByText('Necesito ayuda con IA')).toBeInTheDocument();
  });
});
