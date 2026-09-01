import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EditProfile } from './EditProfile';
import * as api from '../services/api';

const updateProfile = vi.fn();
const mockNavigate = vi.fn();
const authState = vi.hoisted(() => ({
  user: {
    id: 'u1',
    name: 'Danna',
    email: 'p@maia.com',
    role: 'professor' as const,
    department: 'Ing',
    experienceLevel: 'beginner' as const,
    academicArea: 'Math',
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, updateProfile }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('EditProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.usersAPI, 'updateMyProfilePreferences').mockResolvedValue({
      id: 'u1',
      idNumber: 'p@maia.com',
      name: 'Danna',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ing',
      experienceLevel: 'intermediate',
      academicArea: 'Física',
    });
  });

  it('actualiza perfil de docente y navega a /profile', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>,
    );

    await user.clear(screen.getByLabelText(/Nombre completo/i));
    await user.type(screen.getByLabelText(/Nombre completo/i), 'Danna Actualizada');
    await user.clear(screen.getByLabelText(/Área académica/i));
    await user.type(screen.getByLabelText(/Área académica/i), 'Física');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(api.usersAPI.updateMyProfilePreferences).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('valida nombre, correo y área académica obligatorios', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>,
    );

    await user.clear(screen.getByLabelText(/Nombre completo/i));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));
    expect(toast.error).toHaveBeenCalledWith('El nombre es obligatorio.');

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Danna');
    await user.clear(screen.getByLabelText(/Correo electrónico/i));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));
    expect(toast.error).toHaveBeenCalledWith('El correo electrónico es obligatorio.');

    await user.type(screen.getByLabelText(/Correo electrónico/i), 'p@maia.com');
    await user.clear(screen.getByLabelText(/Área académica/i));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));
    expect(toast.error).toHaveBeenCalledWith('Ingresa tu área académica.');
  });

  it('cancela y navega al perfil', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('actualiza jefe de departamento sin preferencias de docente', async () => {
    authState.user = {
      id: 'j1',
      name: 'Jefe',
      email: 'jefe@maia.com',
      role: 'department_head',
      department: 'Ing',
    };

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText(/Área académica/i)).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Nombre completo/i));
    await user.type(screen.getByLabelText(/Nombre completo/i), 'Jefe Actualizado');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jefe Actualizado' }),
      );
      expect(api.usersAPI.updateMyProfilePreferences).not.toHaveBeenCalled();
    });

    authState.user = {
      id: 'u1',
      name: 'Danna',
      email: 'p@maia.com',
      role: 'professor',
      department: 'Ing',
      experienceLevel: 'beginner',
      academicArea: 'Math',
    };
  });

  it('muestra error si falla el guardado', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.usersAPI, 'updateMyProfilePreferences').mockRejectedValue(new Error('fallo'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo actualizar el perfil. Inténtalo de nuevo.');
    });
  });
});
