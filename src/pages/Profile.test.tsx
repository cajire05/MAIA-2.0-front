import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Profile } from './Profile';
import * as api from '../services/api';

const mockNavigate = vi.fn();
const updateProfile = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
const authState = vi.hoisted(() => ({
  user: {
    id: 'u1',
    idNumber: 'p@maia.com',
    name: 'Danna Lopez',
    email: 'p@maia.com',
    role: 'professor' as const,
    department: 'Ingeniería',
    experienceLevel: 'beginner' as const,
    academicArea: 'Matemáticas',
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, updateProfile }),
}));

vi.mock('../utils/chatStats', () => ({
  getChatSessionCount: vi.fn().mockResolvedValue(2),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.favoriteListsAPI, 'getAll').mockResolvedValue([
      { id: 'l1', name: 'Lista', resourceCount: 3 },
    ]);
    vi.spyOn(api.supportRequestsAPI, 'getMyRequests').mockResolvedValue([
      { id: 'r1', title: 'Ayuda', priority: 'MEDIA', status: 'RECIBIDA', createdAt: new Date().toISOString() },
    ]);
    vi.spyOn(api.usersAPI, 'updateMyProfilePreferences').mockResolvedValue({
      ...authState.user,
      academicArea: 'Física',
      experienceLevel: 'intermediate',
    });
    vi.spyOn(api.usersAPI, 'changePassword').mockResolvedValue(undefined);
    vi.spyOn(api.usersAPI, 'getMe').mockResolvedValue({
      ...authState.user,
      createdAt: '2025-01-15T10:00:00.000Z',
    });
  });

  it('renderiza estadísticas y datos del usuario', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Perfil y Preferencias/i)).toBeInTheDocument();
    expect(screen.getByText('Danna Lopez')).toBeInTheDocument();
    expect(screen.getByText('Principiante')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('guarda preferencias de docente', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await screen.findByText(/Preferencias de Experiencia/i);
    const areaInput = screen.getByLabelText(/Área Académica Primaria/i);
    await user.clear(areaInput);
    await user.type(areaInput, 'Física');
    await user.click(screen.getByRole('button', { name: /Guardar preferencias/i }));

    await waitFor(() => {
      expect(api.usersAPI.updateMyProfilePreferences).toHaveBeenCalled();
      expect(updateProfile).toHaveBeenCalled();
    });
  });

  it('muestra vista de jefe de departamento', async () => {
    authState.user = {
      id: 'j1',
      idNumber: 'jefe@maia.com',
      name: 'Jefe Depto',
      email: 'jefe@maia.com',
      role: 'department_head',
      department: 'Ing',
    };

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Jefe de departamento')).toBeInTheDocument();
    expect(screen.queryByText(/Preferencias de Experiencia/i)).not.toBeInTheDocument();

    authState.user = {
      id: 'u1',
      idNumber: 'p@maia.com',
      name: 'Danna Lopez',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ingeniería',
      experienceLevel: 'beginner',
      academicArea: 'Matemáticas',
    };
  });

  it('cambia la contraseña desde el diálogo de seguridad', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    await user.type(document.getElementById('current-password')!, 'Docente123!');
    await user.type(document.getElementById('new-password')!, 'NuevaPass123');
    await user.type(document.getElementById('confirm-new-password')!, 'NuevaPass123');
    await user.click(screen.getByRole('button', { name: /Guardar contraseña/i }));

    await waitFor(() => {
      expect(api.usersAPI.changePassword).toHaveBeenCalledWith({
        currentPassword: 'Docente123!',
        newPassword: 'NuevaPass123',
      });
      expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada correctamente.');
    });
  });

  it('valida que las contraseñas nuevas coincidan', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    await user.type(document.getElementById('current-password')!, 'Docente123!');
    await user.type(document.getElementById('new-password')!, 'NuevaPass123');
    await user.type(document.getElementById('confirm-new-password')!, 'OtraPass99');
    await user.click(screen.getByRole('button', { name: /Guardar contraseña/i }));

    expect(toast.error).toHaveBeenCalledWith('Las contraseñas nuevas no coinciden.');
    expect(api.usersAPI.changePassword).not.toHaveBeenCalled();
  });

  it('navega a editar perfil al pulsar Editar', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await screen.findByText('Danna Lopez');
    await user.click(screen.getByRole('button', { name: /^Editar$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/edit-profile');
  });

  it('alterna visibilidad de contraseñas en el diálogo', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    const current = document.getElementById('current-password') as HTMLInputElement;
    expect(current.type).toBe('password');
    await user.click(screen.getByRole('button', { name: /Mostrar contraseña actual/i }));
    expect(current.type).toBe('text');
    await user.click(screen.getByRole('button', { name: /Ocultar contraseña actual/i }));
    expect(current.type).toBe('password');
  });

  it('valida contraseña actual vacía y longitud mínima', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    await user.click(screen.getByRole('button', { name: /Guardar contraseña/i }));
    expect(toast.error).toHaveBeenCalledWith('Ingresa tu contraseña actual.');

    await user.type(document.getElementById('current-password')!, 'Actual123!');
    await user.type(document.getElementById('new-password')!, 'corta');
    await user.type(document.getElementById('confirm-new-password')!, 'corta');
    await user.click(screen.getByRole('button', { name: /Guardar contraseña/i }));
    expect(toast.error).toHaveBeenCalledWith('La nueva contraseña debe tener al menos 8 caracteres.');
  });

  it('rechaza nueva contraseña igual a la actual', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    await user.type(document.getElementById('current-password')!, 'MismaPass123');
    await user.type(document.getElementById('new-password')!, 'MismaPass123');
    await user.type(document.getElementById('confirm-new-password')!, 'MismaPass123');
    await user.click(screen.getByRole('button', { name: /Guardar contraseña/i }));

    expect(toast.error).toHaveBeenCalledWith('La nueva contraseña debe ser diferente a la actual.');
  });

  it('muestra error si falla cambiar contraseña', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.usersAPI, 'changePassword').mockRejectedValue(new Error('Clave incorrecta'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    await user.type(document.getElementById('current-password')!, 'Actual123!');
    await user.type(document.getElementById('new-password')!, 'NuevaPass123');
    await user.type(document.getElementById('confirm-new-password')!, 'NuevaPass123');
    await user.click(screen.getByRole('button', { name: /Guardar contraseña/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Clave incorrecta');
    });
  });

  it('cierra el diálogo de contraseña con Cancelar', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /Cambiar la contraseña/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('muestra error si falla guardar preferencias', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.usersAPI, 'updateMyProfilePreferences').mockRejectedValue(new Error('Error de red'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await screen.findByText(/Preferencias de Experiencia/i);
    await user.click(screen.getByRole('button', { name: /Guardar preferencias/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudieron guardar las preferencias. Intenta de nuevo.');
    });
  });

  it('continúa si falla la carga de estadísticas', async () => {
    vi.spyOn(api.favoriteListsAPI, 'getAll').mockRejectedValue(new Error('Stats fail'));
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Perfil y Preferencias/i)).toBeInTheDocument();
    expect(await screen.findByText('Sesiones de chat')).toBeInTheDocument();
  });

  it('muestra nivel intermedio en español', async () => {
    authState.user = {
      ...authState.user,
      experienceLevel: 'intermediate',
    };
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Intermedio')).toBeInTheDocument();
    authState.user = {
      id: 'u1',
      idNumber: 'p@maia.com',
      name: 'Danna Lopez',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ingeniería',
      experienceLevel: 'beginner',
      academicArea: 'Matemáticas',
    };
  });

  it('exige área académica al guardar preferencias', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await screen.findByText(/Preferencias de Experiencia/i);
    const areaInput = screen.getByLabelText(/Área Académica Primaria/i);
    await user.clear(areaInput);
    await user.click(screen.getByRole('button', { name: /Guardar preferencias/i }));

    expect(toast.error).toHaveBeenCalledWith('Ingresa tu área académica primaria.');
  });
});
