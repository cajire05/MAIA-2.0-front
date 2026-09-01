import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SurveyAdmin } from './SurveyAdmin';
import * as api from '../services/api';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const authState = vi.hoisted(() => ({
  user: {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@maia.com',
    role: 'department_head' as const,
    department: 'Ing',
    isAdministrator: true,
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

const template = {
  id: 't1',
  name: 'Plantilla base',
  description: 'Desc',
  active: true,
  intervalDays: 30,
  createdAt: '',
  updatedAt: '',
  questions: [{ id: 'q1', text: 'Pregunta', questionType: 'RATING' as const, sortOrder: 0, required: true }],
};

describe('SurveyAdmin', () => {
  beforeEach(() => {
    authState.user.isAdministrator = true;
    vi.clearAllMocks();
    vi.spyOn(api.surveysAPI.admin, 'listTemplates').mockResolvedValue([template]);
    vi.spyOn(api.surveysAPI.admin, 'listInstances').mockResolvedValue([]);
    vi.spyOn(api.departmentsAPI, 'getAll').mockResolvedValue([{ id: 'd1', name: 'Ing' }]);
    vi.spyOn(api.surveysAPI.admin, 'generateInstance').mockResolvedValue({
      id: 'i1',
      templateId: 't1',
      templateName: 'Plantilla base',
      title: 'Encuesta',
      status: 'ACTIVE',
      opensAt: '',
      closesAt: '',
      remindersSent: 0,
      createdAt: '',
      totalInvitations: 0,
      completedInvitations: 0,
    });
  });

  it('muestra error si falla la carga inicial', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.surveysAPI.admin, 'listTemplates').mockRejectedValue(new Error('fallo'));
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al cargar datos de encuestas');
    });
  });

  it('renderiza panel admin y plantillas', async () => {
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Encuestas de satisfacción/i)).toBeInTheDocument();
    expect(screen.getByText('Plantilla base')).toBeInTheDocument();
  });

  it('redirige si el usuario no es administrador', () => {
    authState.user.isAdministrator = false;
    render(
      <MemoryRouter initialEntries={['/survey-admin']}>
        <SurveyAdmin />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Encuestas de satisfacción/i)).not.toBeInTheDocument();
  });

  it('permite editar, guardar y generar encuesta', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.spyOn(api.surveysAPI.admin, 'updateTemplate').mockResolvedValue(template);
    vi.spyOn(api.surveysAPI.admin, 'getReport').mockResolvedValue({
      instanceId: 'i1',
      title: 'E',
      templateName: 'Plantilla base',
      opensAt: '',
      closesAt: '',
      totalInvitations: 1,
      completedInvitations: 0,
      responseRatePercent: 0,
      averageSatisfaction: 4,
      ratingDistribution: { 4: 2, 5: 1 },
      questionMetrics: [
        {
          questionId: 'q1',
          questionText: '¿Satisfacción?',
          questionType: 'RATING',
          averageRating: 4.5,
          responseCount: 3,
        },
      ],
    });
    vi.spyOn(api.surveysAPI.admin, 'listInstances').mockResolvedValue([
      {
        id: 'i1',
        templateId: 't1',
        templateName: 'Plantilla base',
        title: 'Encuesta activa',
        status: 'ACTIVE',
        opensAt: '',
        closesAt: '',
        remindersSent: 0,
        createdAt: '',
        totalInvitations: 5,
        completedInvitations: 2,
      },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    await user.click(screen.getByTitle('Generar encuesta ahora'));
    await waitFor(() => expect(api.surveysAPI.admin.generateInstance).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /Ver reporte/i }));
    await waitFor(() => expect(api.surveysAPI.admin.getReport).toHaveBeenCalledWith('i1'));
    expect(await screen.findByText(/Tasa de respuesta/i)).toBeInTheDocument();
  });

  it('selecciona plantilla, edita campos y guarda actualización', async () => {
    vi.spyOn(api.surveysAPI.admin, 'updateTemplate').mockResolvedValue({
      ...template,
      name: 'Plantilla editada',
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    await user.click(screen.getByRole('button', { name: /Plantilla base/i }));

    const nameInput = screen.getByDisplayValue('Plantilla base');
    await user.clear(nameInput);
    await user.type(nameInput, 'Plantilla editada');
    await user.click(screen.getByRole('button', { name: /Guardar plantilla/i }));

    await waitFor(() => {
      expect(api.surveysAPI.admin.updateTemplate).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ name: 'Plantilla editada' }),
      );
    });
  });

  it('crea una plantilla nueva con preguntas', async () => {
    vi.spyOn(api.surveysAPI.admin, 'createTemplate').mockResolvedValue({
      ...template,
      id: 't-new',
      name: 'Nueva plantilla',
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    await user.click(screen.getByRole('button', { name: /^Nueva$/i }));
    const newCard = screen.getByText('Nueva plantilla').closest('[data-slot="card"]') as HTMLElement;
    const [nameInput] = within(newCard).getAllByRole('textbox');
    await user.type(nameInput, 'Nueva plantilla');
    await user.type(within(newCard).getByPlaceholderText('Texto de la pregunta'), '¿Qué tal el curso?');
    await user.click(screen.getByRole('button', { name: /Agregar pregunta/i }));
    expect(screen.getAllByPlaceholderText('Texto de la pregunta')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /Guardar plantilla/i }));

    await waitFor(() => {
      expect(api.surveysAPI.admin.createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nueva plantilla' }),
      );
    });
  });

  it('elimina plantilla cuando el usuario confirma', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.spyOn(api.surveysAPI.admin, 'deleteTemplate').mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    const row = screen.getByText('Plantilla base').closest('.flex.items-center');
    const actionButtons = within(row as HTMLElement).getAllByRole('button');
    await user.click(actionButtons[actionButtons.length - 1]);

    await waitFor(() => {
      expect(api.surveysAPI.admin.deleteTemplate).toHaveBeenCalledWith('t1');
    });
  });

  it('muestra error al guardar sin nombre', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    await user.click(screen.getByRole('button', { name: /^Nueva$/i }));
    await user.click(screen.getByRole('button', { name: /Guardar plantilla/i }));

    expect(toast.error).toHaveBeenCalledWith('El nombre de la plantilla es obligatorio');
  });

  it('agrega pregunta, cambia tipo y quita una', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    await user.click(screen.getByRole('button', { name: /^Nueva$/i }));
    await user.click(screen.getByRole('button', { name: /Agregar pregunta/i }));

    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
    await user.selectOptions(selects[selects.length - 1], 'TEXT');

    const quitarButtons = screen.getAllByRole('button', { name: /Quitar/i });
    await user.click(quitarButtons[0]);
    expect(screen.getAllByPlaceholderText('Texto de la pregunta')).toHaveLength(1);
  });

  it('genera encuesta para un departamento específico', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SurveyAdmin />
      </MemoryRouter>,
    );

    await screen.findByText('Plantilla base');
    await user.click(screen.getByTestId('select-dept-1'));
    await user.click(screen.getByTitle('Generar encuesta ahora'));

    await waitFor(() => {
      expect(api.surveysAPI.admin.generateInstance).toHaveBeenCalledWith('t1', 'dept-1');
    });
  });
});
