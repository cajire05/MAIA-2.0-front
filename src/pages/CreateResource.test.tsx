import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreateResource } from './CreateResource';
import * as api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('CreateResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.resourcesAPI, 'create').mockResolvedValue({ id: 'new-r1' });
    vi.spyOn(api.resourcesAPI, 'uploadAttachment').mockResolvedValue({ path: '/files/x.pdf' });
  });

  it('crea recurso y navega a mis recursos', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Título/i), 'Nueva guía');
    await user.type(screen.getByLabelText(/Descripción/i), 'Contenido útil');
    await user.type(screen.getByLabelText(/Categoría/i), 'IA');
    await user.type(screen.getByLabelText(/Disciplina/i), 'Ingeniería');
    await user.click(screen.getByRole('button', { name: /Publicar recurso/i }));

    await waitFor(() => {
      expect(api.resourcesAPI.create).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/library');
    });
  });

  it('valida campos obligatorios antes de publicar', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Publicar recurso/i }));

    expect(toast.error).toHaveBeenCalledWith('El título es obligatorio');
    expect(api.resourcesAPI.create).not.toHaveBeenCalled();
  });

  it('publica recurso con archivo adjunto', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Título/i), 'Con adjunto');
    await user.type(screen.getByLabelText(/Descripción/i), 'Detalle');
    await user.type(screen.getByLabelText(/Categoría/i), 'IA');
    await user.type(screen.getByLabelText(/Disciplina/i), 'Ing');

    const file = new File(['contenido'], 'guia.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await user.click(screen.getByRole('button', { name: /Publicar recurso/i }));

    await waitFor(() => {
      expect(api.resourcesAPI.uploadAttachment).toHaveBeenCalledWith('new-r1', file);
    });
  });

  it('vuelve con el botón superior', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Volver/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-resources');
  });

  it('cancela y vuelve a mis recursos', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-resources');
  });

  it('rechaza archivo con extensión no permitida', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    const file = new File(['x'], 'virus.exe', { type: 'application/octet-stream' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith('Tipo de archivo no permitido.');
  });

  it('valida descripción, categoría y disciplina', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateResource />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Título/i), 'Solo título');
    await user.click(screen.getByRole('button', { name: /Publicar recurso/i }));
    expect(toast.error).toHaveBeenCalledWith('La descripción es obligatoria');

    await user.type(screen.getByLabelText(/Descripción/i), 'Texto');
    await user.click(screen.getByRole('button', { name: /Publicar recurso/i }));
    expect(toast.error).toHaveBeenCalledWith('La categoría es obligatoria');

    await user.type(screen.getByLabelText(/Categoría/i), 'IA');
    await user.click(screen.getByRole('button', { name: /Publicar recurso/i }));
    expect(toast.error).toHaveBeenCalledWith('La disciplina es obligatoria');
  });
});
