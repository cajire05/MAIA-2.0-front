import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHistory } from './ChatHistory';
import * as apiModule from '../services/api';

describe('ChatHistory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiModule.chatAPI, 'getMyInteractions').mockResolvedValue({
      content: [
        {
          id: 'i1',
          conversationId: 'conv-1',
          userId: 'u1',
          question: 'Pregunta test',
          answer: 'Respuesta test',
          sequenceNumber: 1,
          createdAt: '2026-05-01T10:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    });
  });

  it('renderiza títulos básicos', async () => {
    render(<ChatHistory />);
    expect(
      await screen.findByText('Historial de Interacciones con IA'),
    ).toBeInTheDocument();
  });

  it('permite aplicar filtros sin crashear', async () => {
    render(<ChatHistory />);

    const applyButton = await screen.findByRole('button', { name: /aplicar filtros/i });
    fireEvent.click(applyButton);

    expect(apiModule.chatAPI.getMyInteractions).toHaveBeenCalled();
  });

  it('muestra interacciones tras cargar', async () => {
    render(<ChatHistory />);
    expect(await screen.findByText(/Pregunta test/i)).toBeInTheDocument();
  });

  it('limpia filtros y recarga', async () => {
    const user = userEvent.setup();
    render(<ChatHistory />);
    await screen.findByText(/Pregunta test/i);

    const convInput = screen.getByLabelText(/ID de Conversación/i);
    await user.type(convInput, 'conv-99');
    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() => {
      expect((convInput as HTMLInputElement).value).toBe('');
    });
  });

  it('navega entre páginas cuando hay más de una', async () => {
    vi.spyOn(apiModule.chatAPI, 'getMyInteractions').mockResolvedValue({
      content: [
        {
          id: 'i1',
          conversationId: 'conv-1',
          userId: 'u1',
          question: 'Pregunta test',
          answer: 'Respuesta test',
          sequenceNumber: 1,
          createdAt: '2026-05-01T10:00:00',
        },
      ],
      totalElements: 20,
      totalPages: 2,
      size: 10,
      number: 0,
    });

    const user = userEvent.setup();
    render(<ChatHistory />);
    await screen.findByText(/Pregunta test/i);

    await user.click(screen.getByRole('link', { name: /Next/i }));

    await waitFor(() => {
      expect(apiModule.chatAPI.getMyInteractions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  it('muestra error cuando falla la carga', async () => {
    vi.spyOn(apiModule.chatAPI, 'getMyInteractions').mockRejectedValue(
      new Error('Servicio no disponible'),
    );

    render(<ChatHistory />);

    expect(await screen.findByText(/Problema al cargar el historial/i)).toBeInTheDocument();
    expect(screen.getByText(/Servicio no disponible/i)).toBeInTheDocument();
  });

  it('muestra mensaje vacío sin resultados', async () => {
    vi.spyOn(apiModule.chatAPI, 'getMyInteractions').mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
    });

    render(<ChatHistory />);

    expect(
      await screen.findByText(/No se encontraron interacciones/i),
    ).toBeInTheDocument();
  });

  it('aplica filtro de fechas al enviar filtros', async () => {
    const user = userEvent.setup();
    render(<ChatHistory />);
    await screen.findByText(/Pregunta test/i);

    await user.type(screen.getByLabelText(/Desde/i), '2026-05-01');
    await user.type(screen.getByLabelText(/Hasta/i), '2026-05-10');
    await user.click(screen.getByRole('button', { name: /aplicar filtros/i }));

    await waitFor(() => {
      expect(apiModule.chatAPI.getMyInteractions).toHaveBeenCalledWith(
        expect.objectContaining({
          fromDate: '2026-05-01T00:00:00',
          toDate: '2026-05-10T23:59:59.999999999',
        }),
      );
    });
  });
});

