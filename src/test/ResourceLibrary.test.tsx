import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ResourceLibrary } from '../pages/ResourceLibrary';

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'test-user-1',
            idNumber: 'test-user-1',
            name: 'Usuario Test',
            email: 'test@maia.com',
            role: 'professor' as const,
            department: 'Ingeniería',
        },
        login: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
        refreshSession: vi.fn(async () => null),
        isLoading: false,
    }),
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock API modules
const mockGetAllResources = vi.fn();
const mockGetAllFavorites = vi.fn();
const mockToggleFavorite = vi.fn();
const mockGetAllLists = vi.fn();
const mockCreateList = vi.fn();
const mockAddResource = vi.fn();
const mockDeleteResource = vi.fn();

vi.mock('../services/api', () => ({
    resourcesAPI: {
        getAll: (...args: unknown[]) => mockGetAllResources(...args),
        delete: (...args: unknown[]) => mockDeleteResource(...args),
    },
    favoritesAPI: {
        getAll: (...args: unknown[]) => mockGetAllFavorites(...args),
        toggle: (...args: unknown[]) => mockToggleFavorite(...args),
    },
    favoriteListsAPI: {
        getAll: (...args: unknown[]) => mockGetAllLists(...args),
        create: (...args: unknown[]) => mockCreateList(...args),
        addResource: (...args: unknown[]) => mockAddResource(...args),
    },
}));

const MOCK_RESOURCES = [
    {
        id: '1',
        title: 'Recurso de prueba A',
        description: 'Descripción del recurso A',
        type: 'guide',
        level: 'beginner',
        discipline: 'Matemáticas',
        activity: 'Evaluación',
        dateAdded: '2025-09-15',
    },
    {
        id: '2',
        title: 'Recurso de prueba B',
        description: 'Descripción del recurso B',
        type: 'case_study',
        level: 'advanced',
        discipline: 'STEM',
        activity: 'Programación',
        dateAdded: '2025-09-20',
    },
];

const MOCK_FAVORITES = [
    { id: 'fav1', resourceId: '1' },
];

const MOCK_LISTS = [
    { id: 'list1', name: 'Mi Colección', resourceCount: 2 },
];

describe('ResourceLibrary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAllResources.mockResolvedValue(MOCK_RESOURCES);
        mockGetAllFavorites.mockResolvedValue(MOCK_FAVORITES);
        mockGetAllLists.mockResolvedValue(MOCK_LISTS);
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <ResourceLibrary />
            </BrowserRouter>
        );
    };

    it('renders the page title correctly', async () => {
        renderComponent();
        expect(screen.getByText('Biblioteca de Recursos')).toBeInTheDocument();
    });

    it('fetches and displays resources from the API', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
            expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument();
        });

        expect(mockGetAllResources).toHaveBeenCalledOnce();
    });

    it('loads favorites from the backend on mount', async () => {
        renderComponent();

        await waitFor(() => {
            expect(mockGetAllFavorites).toHaveBeenCalledOnce();
        });
    });

    it('loads collections from the backend on mount', async () => {
        renderComponent();

        await waitFor(() => {
            expect(mockGetAllLists).toHaveBeenCalledOnce();
        });
    });

    it('toggles a favorite when clicking the heart button', async () => {
        mockToggleFavorite.mockResolvedValue({
            resourceId: '2',
            isFavorite: true,
            message: 'Recurso marcado como favorito',
        });

        renderComponent();

        // Wait for resources to load
        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument();
        });

        // Orden de tarjetas puede cambiar (más recientes primero). Seleccionamos por título.
        const title = screen.getByText('Recurso de prueba B');
        const card = title.closest('[data-slot="card"]') as HTMLElement;
        expect(card).toBeTruthy();

        const heartButton = Array.from(card.querySelectorAll('button')).find(
            (btn) => btn.querySelector('.lucide-heart') !== null,
        ) as HTMLElement | undefined;
        expect(heartButton).toBeTruthy();

        await userEvent.click(heartButton as HTMLElement);

        await waitFor(() => {
            expect(mockToggleFavorite).toHaveBeenCalledWith('2');
        });
    });

    it('navigates to collections page when Ver Colecciones is clicked', async () => {
        renderComponent();

        // Click the "Ver Colecciones" button in the header
        const collectionsBtn = screen.getByRole('button', { name: /Ver Colecciones/i });
        expect(collectionsBtn).toBeInTheDocument();
        
        // Navigation is handled by react-router link/navigate
        await userEvent.click(collectionsBtn);
    });

    it('shows the correct favorites count in the stats', async () => {
        renderComponent();

        await waitFor(() => {
            // Stats card shows "Favoritos" with count from backend
            const favoritosText = screen.getByText('Favoritos');
            expect(favoritosText).toBeInTheDocument();
        });
    });

    it('limpia todos los filtros con el botón Limpiar filtros', async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Buscar recursos...');
        await user.type(searchInput, 'prueba B');

        await waitFor(() => {
            expect(screen.queryByText('Recurso de prueba A')).not.toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

        await waitFor(() => {
            expect(searchInput).toHaveValue('');
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
            expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument();
        });
    });

    it('filters resources by search term', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Buscar recursos...');
        await userEvent.type(searchInput, 'prueba B');

        await waitFor(() => {
            expect(screen.queryByText('Recurso de prueba A')).not.toBeInTheDocument();
            expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument();
        });
    });

    it('abre detalle del recurso y aplica filtros de nivel', async () => {
        mockGetAllLists.mockResolvedValue([{ id: 'list-1', name: 'Mi colección' }]);
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });

        // Asegurar que abrimos el detalle del recurso A, no depende del orden.
        const titleA = screen.getByText('Recurso de prueba A');
        const cardA = titleA.closest('[data-slot="card"]') as HTMLElement;
        expect(cardA).toBeTruthy();
        await user.click(within(cardA).getByRole('button', { name: /Ver Recurso/i }));
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText(/Descripción del recurso A/i)).toBeInTheDocument();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        const levelFilterSelect = screen.getByPlaceholderText('Buscar recursos...')
            .closest('[data-slot="card-content"]')
            ?.querySelector('[data-testid="mock-select"]');
        expect(levelFilterSelect).toBeTruthy();
        await user.click(within(levelFilterSelect as HTMLElement).getByTestId('select-beginner'));
        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });
    });

    it('mapea recursos con tipos y niveles variados del API', async () => {
        mockGetAllResources.mockResolvedValue([
            {
                id: '3',
                title: 'Caso especial',
                description: 'Desc',
                type: 'bes_practices',
                aiUseLevel: 'Principiante',
                aiasLevel: 2,
            },
            {
                id: '4',
                title: 'Avanzado AIAS',
                description: 'Desc',
                type: 'case_study',
                aiUseLevel: 'Nivel avanzado',
                aiasLevel: 'nivel_5',
                level: 'advanced',
            },
        ]);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Caso especial')).toBeInTheDocument();
            expect(screen.getByText('Avanzado AIAS')).toBeInTheDocument();
        });
    });

    it('añade recurso a una colección', async () => {
        mockAddResource.mockResolvedValue(undefined);
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument());
        const cardB = screen.getByText('Recurso de prueba B').closest('[data-slot="card"]') as HTMLElement;
        await user.click(within(cardB).getByTestId('select-list-1'));

        await waitFor(() => {
            expect(mockAddResource).toHaveBeenCalledWith('list-1', '2');
        });
    });

    it('elimina recurso propio desde la tarjeta', async () => {
        mockGetAllResources.mockResolvedValue([
            {
                id: 'own-1',
                title: 'Mi publicación',
                description: 'Desc propia',
                type: 'guide',
                level: 'beginner',
                authorId: 'test-user-1',
                discipline: 'Ing',
                activity: 'Clase',
                dateAdded: '2025-09-15',
            },
        ]);
        mockDeleteResource.mockResolvedValue(undefined);

        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Mi publicación')).toBeInTheDocument());
        await user.click(screen.getByTitle('Eliminar mi recurso'));
        await user.click(await screen.findByRole('button', { name: /^Eliminar$/i }));

        await waitFor(() => {
            expect(mockDeleteResource).toHaveBeenCalledWith('own-1');
        });
    }, 15_000);

    it('muestra error si falla agregar a colección', async () => {
        const { toast } = await import('sonner');
        mockAddResource.mockRejectedValue(new Error('No se pudo agregar'));
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument());
        const cardB = screen.getByText('Recurso de prueba B').closest('[data-slot="card"]') as HTMLElement;
        await user.click(within(cardB).getByTestId('select-list-1'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('No se pudo agregar');
        });
    });

    it('muestra error cuando falla la carga de recursos', async () => {
        const { toast } = await import('sonner');
        mockGetAllResources.mockRejectedValue(new Error('Servidor caído'));
        renderComponent();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Servidor caído');
        });
    });

    it('filtra por tipo de actividad', async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument());
        const filtersCard = screen.getByPlaceholderText('Buscar recursos...').closest('[data-slot="card-content"]');
        const selects = filtersCard?.querySelectorAll('[data-testid="mock-select"]');
        const typeSelect = selects?.[2] as HTMLElement;
        await user.click(within(typeSelect).getByTestId('select-guide'));

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });
    });

    it('shows empty state when no resources match filters', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Buscar recursos...');
        await userEvent.type(searchInput, 'inexistente_xyz');

        await waitFor(() => {
            expect(screen.getByText('No se encontraron recursos')).toBeInTheDocument();
        });
    });

    it('limpia filtros activos con el botón Limpiar filtros', async () => {
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument());
        const searchInput = screen.getByPlaceholderText('Buscar recursos...');
        await user.type(searchInput, 'inexistente');
        await waitFor(() => expect(screen.queryByText('Recurso de prueba A')).not.toBeInTheDocument());

        const clearBtn = screen.getByRole('button', { name: /Limpiar filtros/i });
        expect(clearBtn).not.toBeDisabled();
        await user.click(clearBtn);

        await waitFor(() => {
            expect(searchInput).toHaveValue('');
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
        });
    });

    it('muestra detalle con URL y adjunto local', async () => {
        mockGetAllResources.mockResolvedValue([
            {
                id: '10',
                title: 'Recurso adjunto',
                description: 'Con archivos',
                type: 'guide',
                level: 'intermediate',
                aiasLevel: 3,
                discipline: 'STEM',
                activity: 'Taller',
                dateAdded: '2025-09-15',
                url: 'https://example.org/recurso',
                attachmentPath: 'resources_files/material.pdf',
            },
        ]);
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso adjunto')).toBeInTheDocument());
        await user.click(screen.getAllByRole('button', { name: /Ver Recurso/i })[0]);

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('Con archivos')).toBeInTheDocument();
        expect(within(dialog).getByRole('link', { name: /example\.org\/recurso/i })).toBeInTheDocument();
        expect(within(dialog).getByRole('link', { name: /material\.pdf/i })).toHaveAttribute(
            'href',
            expect.stringContaining('/api/library/attachments/'),
        );
    });

    it('muestra adjunto con URL absoluta en detalle', async () => {
        mockGetAllResources.mockResolvedValue([
            {
                id: '11',
                title: 'Recurso externo',
                description: 'Adjunto http',
                type: 'example',
                level: 'advanced',
                discipline: 'General',
                activity: 'General',
                dateAdded: '2025-09-15',
                attachmentPath: 'https://cdn.example.com/file.pdf',
            },
        ]);
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso externo')).toBeInTheDocument());
        await user.click(screen.getAllByRole('button', { name: /Ver Recurso/i })[0]);

        const dialog = await screen.findByRole('dialog');
        const link = within(dialog).getByRole('link', { name: /file\.pdf/i });
        expect(link).toHaveAttribute('href', 'https://cdn.example.com/file.pdf');
    });

    it('filtra por nivel AIAS', async () => {
        mockGetAllResources.mockResolvedValue([
            { ...MOCK_RESOURCES[0], aiasLevel: 'nivel_2' },
            { ...MOCK_RESOURCES[1], aiasLevel: 'nivel_5' },
        ]);
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument());
        const filtersCard = screen.getByPlaceholderText('Buscar recursos...').closest('[data-slot="card-content"]');
        const selects = filtersCard?.querySelectorAll('[data-testid="mock-select"]');
        const aiasSelect = selects?.[1] as HTMLElement;
        await user.click(within(aiasSelect).getByTestId('select-aias-2'));

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument();
            expect(screen.queryByText('Recurso de prueba B')).not.toBeInTheDocument();
        });
    });

    it('revierte favorito si falla el toggle', async () => {
        const { toast } = await import('sonner');
        mockToggleFavorite.mockRejectedValue(new Error('Toggle fail'));
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba A')).toBeInTheDocument());
        const cardA = screen.getByText('Recurso de prueba A').closest('[data-slot="card"]') as HTMLElement;
        const hearts = within(cardA).getAllByRole('button').filter((b) => b.querySelector('.lucide-heart'));
        await user.click(hearts[0]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al actualizar favorito');
        });
    });

    it('carga favoritos con id anidado en resource', async () => {
        mockGetAllFavorites.mockResolvedValue([{ id: 'f2', resource: { id: '2' } }]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument();
        });
    });

    it('muestra error al eliminar recurso propio', async () => {
        const { toast } = await import('sonner');
        mockGetAllResources.mockResolvedValue([
            {
                id: 'own-9',
                title: 'Borrar esto',
                description: 'Desc',
                type: 'guide',
                level: 'beginner',
                authorId: 'test-user-1',
                discipline: 'Ing',
                activity: 'Clase',
                dateAdded: '2025-09-15',
            },
        ]);
        mockDeleteResource.mockRejectedValue(new Error('No delete'));
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Borrar esto')).toBeInTheDocument());
        await user.click(screen.getByTitle('Eliminar mi recurso'));
        await user.click(await screen.findByRole('button', { name: /^Eliminar$/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('No delete');
        });
    });

    it('marca favorito tras toggle exitoso', async () => {
        const { toast } = await import('sonner');
        mockToggleFavorite.mockResolvedValue({ resourceId: '2', isFavorite: true, message: 'Agregado' });
        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => expect(screen.getByText('Recurso de prueba B')).toBeInTheDocument());
        const cardB = screen.getByText('Recurso de prueba B').closest('[data-slot="card"]') as HTMLElement;
        const hearts = within(cardB).getAllByRole('button').filter((b) => b.querySelector('.lucide-heart'));
        await user.click(hearts[0]);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Agregado');
        });
    });
});
