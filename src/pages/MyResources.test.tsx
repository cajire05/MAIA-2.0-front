import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MyResources } from './MyResources';
import * as api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('MyResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.resourcesAPI, 'getMyResources').mockResolvedValue([
      {
        id: 'r1',
        title: 'Mi guía',
        description: 'Desc',
        type: 'guide',
        category: 'IA',
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.spyOn(api.resourcesAPI, 'delete').mockResolvedValue(undefined);
    vi.spyOn(api.resourcesAPI, 'getById').mockResolvedValue({
      id: 'r1',
      title: 'Mi guía',
      description: 'Descripción completa',
      type: 'guide',
      category: 'IA',
      discipline: 'Ingeniería',
      activityType: 'Taller',
      url: 'https://example.com/guia',
      createdAt: new Date().toISOString(),
    });
  });

  it('lista recursos propios y permite crear nuevo', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Mi guía')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Crear recurso/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/library/create');
  });

  it('abre el detalle del recurso al pulsar Ver detalle', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    await screen.findByText('Mi guía');
    await user.click(screen.getByRole('button', { name: /Ver detalle/i }));

    await waitFor(() => {
      expect(api.resourcesAPI.getById).toHaveBeenCalledWith('r1');
    });
    expect(await screen.findByText('Descripción completa')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería')).toBeInTheDocument();
    expect(screen.getByText('Taller')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /example\.com\/guia/i })).toBeInTheDocument();
  });

  it('elimina un recurso tras confirmar', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    await screen.findByText('Mi guía');
    await user.click(screen.getByTitle(/Eliminar recurso/i));
    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }));

    await waitFor(() => {
      expect(api.resourcesAPI.delete).toHaveBeenCalledWith('r1');
    });
  });

  it('muestra estado vacío y navega a crear primer recurso', async () => {
    vi.spyOn(api.resourcesAPI, 'getMyResources').mockResolvedValue([]);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Aún no has creado ningún recurso/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Crear mi primer recurso/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/library/create');
  });

  it('muestra recursos con distintos tipos y nivel AIAS', async () => {
    vi.spyOn(api.resourcesAPI, 'getMyResources').mockResolvedValue([
      {
        id: 'r2',
        title: 'Caso propio',
        description: 'Desc',
        type: 'case_study',
        category: 'IA',
        aiasLevel: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'r3',
        title: 'Ejemplo propio',
        description: 'Desc',
        type: 'example',
        category: 'STEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Caso propio')).toBeInTheDocument();
    expect(screen.getByText('Ejemplo propio')).toBeInTheDocument();
    expect(screen.getByText('Caso de estudio')).toBeInTheDocument();
    expect(screen.getByText('3: Colaboración')).toBeInTheDocument();
  });

  it('muestra error al fallar la carga', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.resourcesAPI, 'getMyResources').mockRejectedValue(new Error('Sin conexión'));
    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Sin conexión');
    });
  });

  it('muestra error si falla eliminar recurso', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.resourcesAPI, 'delete').mockRejectedValue(new Error('No se pudo borrar'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyResources />
      </MemoryRouter>,
    );

    await screen.findByText('Mi guía');
    await user.click(screen.getByTitle(/Eliminar recurso/i));
    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo borrar');
    });
  });
});
