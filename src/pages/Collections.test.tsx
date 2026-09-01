import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Collections } from './Collections';
import * as api from '../services/api';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('Collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.favoriteListsAPI, 'getAll').mockResolvedValue([
      { id: 'l1', name: 'Favoritos curso', resourceCount: 2 },
    ]);
    vi.spyOn(api.favoriteListsAPI, 'getDetail').mockResolvedValue({
      id: 'l1',
      name: 'Favoritos curso',
      resources: [
        {
          id: 'r1',
          resourceId: 'res-1',
          title: 'Recurso A',
          type: 'case_study',
          level: 'beginner',
          description: 'Desc A',
          category: 'Estrategia IA Icesi',
          aiasLevel: '2',
          activityType: 'Taller',
        },
      ],
    });
    vi.spyOn(api.favoriteListsAPI, 'create').mockResolvedValue({
      id: 'l2',
      name: 'Nueva lista',
      resourceCount: 0,
    });
    vi.spyOn(api.favoriteListsAPI, 'updateName').mockResolvedValue({
      id: 'l1',
      name: 'Renombrada',
      resourceCount: 2,
    });
    vi.spyOn(api.favoriteListsAPI, 'delete').mockResolvedValue(undefined);
    vi.spyOn(api.favoriteListsAPI, 'removeResource').mockResolvedValue(undefined);
    vi.spyOn(api.resourcesAPI, 'getById').mockResolvedValue({
      id: 'res-1',
      title: 'Recurso A',
      description: 'Descripción completa del recurso',
      type: 'case_study',
      category: 'IA',
      discipline: 'Ingeniería',
      activityType: 'Taller',
      url: 'https://example.com/recurso',
      createdAt: new Date().toISOString(),
    });
  });

  it('muestra colecciones y abre detalle', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Favoritos curso')).toBeInTheDocument();
    await user.click(screen.getByText('Favoritos curso'));

    await waitFor(() => {
      expect(api.favoriteListsAPI.getDetail).toHaveBeenCalledWith('l1');
      expect(screen.getByText('Recurso A')).toBeInTheDocument();
    });
  });

  it('crea una nueva colección', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByRole('button', { name: /Nueva colección/i }));
    await user.type(screen.getByLabelText(/Nombre de la Colección/i), 'Nueva lista');
    await user.click(screen.getByRole('button', { name: /Crear Colección/i }));

    await waitFor(() => {
      expect(api.favoriteListsAPI.create).toHaveBeenCalledWith('Nueva lista');
    });
  });

  it('renombra y elimina una colección', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByTitle('Editar nombre'));
    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/^Nombre$/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renombrada');
    await user.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(api.favoriteListsAPI.updateName).toHaveBeenCalledWith('l1', 'Renombrada');
    });

    await user.click(screen.getByTitle('Eliminar colección'));
    await user.click(screen.getByRole('button', { name: /Eliminar/i }));

    await waitFor(() => {
      expect(api.favoriteListsAPI.delete).toHaveBeenCalledWith('l1');
    });
  });

  it('abre el detalle de un recurso guardado en la colección', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await screen.findByText('Recurso A');
    await user.click(screen.getByRole('button', { name: /Ver detalle/i }));

    await waitFor(() => {
      expect(api.resourcesAPI.getById).toHaveBeenCalledWith('res-1');
    });
    expect(await screen.findByText('Descripción completa del recurso')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /example\.com\/recurso/i })).toBeInTheDocument();
  });

  it('remueve un recurso de la colección abierta', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await screen.findByText('Recurso A');

    await user.click(screen.getByTitle('Remover de la colección'));

    await waitFor(() => {
      expect(api.favoriteListsAPI.removeResource).toHaveBeenCalledWith('l1', 'res-1');
    });
  });

  it('muestra error al cargar colecciones', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.favoriteListsAPI, 'getAll').mockRejectedValue(new Error('Fallo red'));
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Fallo red');
      expect(screen.getByText(/Error al cargar colecciones/i)).toBeInTheDocument();
    });
  });

  it('muestra estado vacío sin colecciones', async () => {
    vi.spyOn(api.favoriteListsAPI, 'getAll').mockResolvedValue([]);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/No tienes colecciones aún/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Crear Colección$/i }));
    expect(screen.getByLabelText(/Nombre de la Colección/i)).toBeInTheDocument();
  });

  it('muestra fecha de creación en tarjeta de colección', async () => {
    vi.spyOn(api.favoriteListsAPI, 'getAll').mockResolvedValue([
      { id: 'l1', name: 'Con fecha', resourceCount: 1, createdAt: '2024-06-15T12:00:00Z' },
    ]);
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Creada:/i)).toBeInTheDocument();
    expect(screen.getByText(/1 recurso$/i)).toBeInTheDocument();
  });

  it('no crea colección sin nombre', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByRole('button', { name: /Nueva colección/i }));
    await user.click(screen.getByRole('button', { name: /Crear Colección/i }));

    expect(toast.error).toHaveBeenCalledWith('Por favor ingresa un nombre');
    expect(api.favoriteListsAPI.create).not.toHaveBeenCalled();
  });

  it('muestra colección vacía en detalle', async () => {
    vi.spyOn(api.favoriteListsAPI, 'getDetail').mockResolvedValue({
      id: 'l2',
      name: 'Vacía',
      resources: [],
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    expect(await screen.findByText(/Colección vacía/i)).toBeInTheDocument();
  });

  it('muestra detalle con varios recursos y tipos distintos', async () => {
    vi.spyOn(api.favoriteListsAPI, 'getDetail').mockResolvedValue({
      id: 'l1',
      name: 'Varios',
      resources: [
        {
          id: 'r1',
          resourceId: 'res-1',
          title: 'Guía',
          type: 'guide',
          description: 'G',
          category: 'Guías',
          aiasLevel: '1',
          activityType: 'guide',
        },
        {
          id: 'r2',
          resourceId: 'res-2',
          title: 'Ejemplo',
          type: 'example',
          category: 'Ejemplos',
          activityType: 'example',
        },
        {
          id: 'r3',
          resourceId: 'res-3',
          title: 'Práctica',
          type: 'best_practice',
          category: 'Mejores prácticas',
          activityType: 'best_practice',
        },
      ],
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));

    expect(await screen.findByText(/3 recursos/i)).toBeInTheDocument();
    expect(screen.getAllByText('Ejemplo').length).toBeGreaterThan(0);
    expect(screen.getByText('Práctica')).toBeInTheDocument();
    expect(screen.getByText('Mejor práctica')).toBeInTheDocument();
  });

  it('muestra error al abrir detalle de colección', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.favoriteListsAPI, 'getDetail').mockRejectedValue(new Error('Detalle no disponible'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Detalle no disponible');
    });
  });

  it('muestra error al crear colección', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.favoriteListsAPI, 'create').mockRejectedValue(new Error('No se pudo crear'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByRole('button', { name: /Nueva colección/i }));
    await user.type(screen.getByLabelText(/Nombre de la Colección/i), 'Fallida');
    await user.click(screen.getByRole('button', { name: /Crear Colección/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo crear');
    });
  });

  it('muestra error al renombrar colección', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.favoriteListsAPI, 'updateName').mockRejectedValue(new Error('Rename fail'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByTitle('Editar nombre'));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Rename fail');
    });
  });

  it('muestra error al eliminar colección', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.favoriteListsAPI, 'delete').mockRejectedValue(new Error('Delete fail'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByTitle('Eliminar colección'));
    await user.click(screen.getByRole('button', { name: /^Eliminar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Delete fail');
    });
  });

  it('muestra error al remover recurso de la colección', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.favoriteListsAPI, 'removeResource').mockRejectedValue(new Error('Remove fail'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await user.click(screen.getByTitle('Remover de la colección'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Remove fail');
    });
  });

  it('mantiene datos de tarjeta si falla getById al ver detalle', async () => {
    vi.spyOn(api.resourcesAPI, 'getById').mockRejectedValue(new Error('No detail'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await user.click(screen.getByRole('button', { name: /Ver detalle/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Desc A')).toBeInTheDocument();
    expect(screen.queryByText('Descripción completa del recurso')).not.toBeInTheDocument();
  });

  it('muestra adjunto y URL en detalle del recurso', async () => {
    vi.spyOn(api.resourcesAPI, 'getById').mockResolvedValue({
      id: 'res-1',
      title: 'Recurso A',
      description: 'Completo',
      type: 'guide',
      category: 'IA',
      url: 'https://icesi.edu.co/doc',
      attachmentPath: 'resources_files/guia.pdf',
      aiasLevel: 2,
      aiUseLevel: 'Intermedio',
      createdAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await user.click(screen.getByRole('button', { name: /Ver detalle/i }));

    expect(await screen.findByText('Completo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /icesi\.edu\.co\/doc/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /guia\.pdf/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/api/library/attachments/'),
    );
  });

  it('renombra colección desde la vista de detalle', async () => {
    vi.spyOn(api.favoriteListsAPI, 'updateName').mockImplementation(async (_id, name) => ({
      id: 'l1',
      name,
      resourceCount: 2,
    }));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    const detailPencils = screen.getAllByRole('button').filter(
      (b) => b.querySelector('.lucide-pencil'),
    );
    await user.click(detailPencils[detailPencils.length - 1]);
    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/^Nombre$/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renombrada en detalle');
    await user.click(within(dialog).getByRole('button', { name: /^Guardar$/i }));

    await waitFor(() => {
      expect(api.favoriteListsAPI.updateName).toHaveBeenCalledWith('l1', 'Renombrada en detalle');
      expect(screen.getByRole('heading', { name: /Renombrada en detalle/i })).toBeInTheDocument();
    });
  });

  it('muestra recurso sin descripción como Sin descripción', async () => {
    vi.spyOn(api.favoriteListsAPI, 'getDetail').mockResolvedValue({
      id: 'l1',
      name: 'Sin desc',
      resources: [{
        id: 'r9',
        resourceId: 'res-9',
        title: 'Solo título',
        category: 'IA educativa',
        aiasLevel: '3',
        activityType: 'Seminario',
      }],
    });
    vi.spyOn(api.resourcesAPI, 'getById').mockResolvedValue({
      id: 'res-9',
      title: 'Solo título',
      description: '',
      type: 'other',
      category: 'IA educativa',
      activityType: 'Seminario',
      aiasLevel: 3,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await user.click(screen.getByRole('button', { name: /Ver detalle/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Sin descripción')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dialog).getAllByText('IA educativa').length).toBeGreaterThan(0);
      expect(within(dialog).getAllByText('Seminario').length).toBeGreaterThan(0);
      expect(within(dialog).getByText('3: Colaboración')).toBeInTheDocument();
    });
  });

  it('vuelve al listado desde el detalle', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Collections />
      </MemoryRouter>,
    );

    await screen.findByText('Favoritos curso');
    await user.click(screen.getByText('Favoritos curso'));
    await screen.findByText('Recurso A');

    const backBtn = document.querySelector('button .lucide-arrow-left')?.closest('button');
    expect(backBtn).toBeTruthy();
    await user.click(backBtn as HTMLButtonElement);

    expect(await screen.findByText('Favoritos curso')).toBeInTheDocument();
    expect(screen.queryByText('Recurso A')).not.toBeInTheDocument();
  });
});
