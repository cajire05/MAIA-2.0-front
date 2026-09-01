import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TeacherSurveys } from './TeacherSurveys';
import * as api from '../services/api';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const pendingSurvey = {
  invitationId: 'inv-1',
  instanceId: 'inst-1',
  title: 'Encuesta Q1',
  templateName: 'Plantilla',
  closesAt: new Date().toISOString(),
  questions: [
    { id: 'q1', text: '¿Satisfacción?', questionType: 'RATING' as const, sortOrder: 0, required: true },
    { id: 'q2', text: 'Comentario', questionType: 'TEXT' as const, sortOrder: 1, required: false },
  ],
};

describe('TeacherSurveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api.surveysAPI, 'getPending').mockResolvedValue([pendingSurvey]);
    vi.spyOn(api.surveysAPI, 'respond').mockResolvedValue(undefined);
  });

  it('carga encuestas pendientes y permite enviar respuesta', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/surveys']}>
        <Routes>
          <Route path="/surveys" element={<TeacherSurveys />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Encuestas de satisfacción/i)).toBeInTheDocument();
    expect(screen.getByText('Encuesta Q1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Calificación 5 de 5/i }));
    await user.type(screen.getByPlaceholderText(/Escribe tu comentario/i), 'Muy bien');
    await user.click(screen.getByRole('button', { name: /Enviar respuestas/i }));

    await waitFor(() => {
      expect(api.surveysAPI.respond).toHaveBeenCalledWith(
        'inv-1',
        expect.arrayContaining([
          expect.objectContaining({ questionId: 'q1', ratingValue: 5 }),
          expect.objectContaining({ questionId: 'q2', textValue: 'Muy bien' }),
        ]),
      );
    });
  });

  it('muestra mensaje cuando no hay encuestas pendientes', async () => {
    vi.spyOn(api.surveysAPI, 'getPending').mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/surveys']}>
        <Routes>
          <Route path="/surveys" element={<TeacherSurveys />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/No tienes encuestas pendientes/i)).toBeInTheDocument();
  });

  it('muestra error si falla la carga de encuestas', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.surveysAPI, 'getPending').mockRejectedValue(new Error('Red caída'));
    render(
      <MemoryRouter initialEntries={['/surveys']}>
        <Routes>
          <Route path="/surveys" element={<TeacherSurveys />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudieron cargar las encuestas pendientes');
    });
  });

  it('permite cambiar entre varias encuestas pendientes', async () => {
    vi.spyOn(api.surveysAPI, 'getPending').mockResolvedValue([
      pendingSurvey,
      {
        ...pendingSurvey,
        invitationId: 'inv-2',
        instanceId: 'inst-2',
        title: 'Encuesta Q2',
      },
    ]);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/surveys']}>
        <Routes>
          <Route path="/surveys" element={<TeacherSurveys />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Encuesta Q1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Encuesta Q2' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Encuesta Q2' })).toBeInTheDocument();
    });
  });

  it('muestra error si falla el envío de respuestas', async () => {
    const { toast } = await import('sonner');
    vi.spyOn(api.surveysAPI, 'respond').mockRejectedValue(new Error('Envío fallido'));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/surveys']}>
        <Routes>
          <Route path="/surveys" element={<TeacherSurveys />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('Encuesta Q1');
    await user.click(screen.getByRole('button', { name: /Calificación 3 de 5/i }));
    await user.click(screen.getByRole('button', { name: /Enviar respuestas/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Envío fallido');
    });
  });
});
