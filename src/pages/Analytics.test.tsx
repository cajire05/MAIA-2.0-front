import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Analytics } from './Analytics';
import * as apiModule from '../services/api';

const mockDashboard: apiModule.DepartmentDashboardDTO = {
  totalUsers: 10,
  activeUsers: 7,
  chatInteractions: 50,
  conversations: 12,
  requestsRecibidas: 2,
  requestsEnProceso: 1,
  requestsResueltas: 8,
};

const mockUsage: apiModule.AnalyticsUsageDTO = {
  period: 'MONTH',
  dataPoints: [
    { date: '2026-04-01', count: 5 },
    { date: '2026-04-02', count: 8 },
  ],
};

const mockTopics: apiModule.TopicDTO[] = [
  { topic: 'inteligencia', count: 15 },
  { topic: 'curricular', count: 10 },
];

describe('Analytics', () => {
  beforeEach(() => {
    vi.spyOn(apiModule.analyticsAPI, 'getDashboard').mockResolvedValue(mockDashboard);
    vi.spyOn(apiModule.analyticsAPI, 'getUsage').mockResolvedValue(mockUsage);
    vi.spyOn(apiModule.analyticsAPI, 'getTopics').mockResolvedValue(mockTopics);
  });

  it('renderiza el título de la página', async () => {
    render(<Analytics />);
    expect(await screen.findByText('Analítica e Insights')).toBeInTheDocument();
  });

  it('muestra el total de profesores tras cargar', async () => {
    render(<Analytics />);
    const matches = await screen.findAllByText('10');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('muestra los usuarios activos tras cargar', async () => {
    render(<Analytics />);
    expect(await screen.findByText('7')).toBeInTheDocument();
  });

  it('muestra el número de chats tras cargar', async () => {
    render(<Analytics />);
    expect(await screen.findByText('50')).toBeInTheDocument();
  });

  it('muestra los temas más populares tras cargar', async () => {
    render(<Analytics />);
    const matches = await screen.findAllByText(/inteligencia/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(await screen.findByText(/curricular/i)).toBeInTheDocument();
  });

  it('muestra error si la API falla', async () => {
    vi.spyOn(apiModule.analyticsAPI, 'getDashboard').mockRejectedValue(
      new Error('Error de conexión'),
    );

    render(<Analytics />);
    expect(await screen.findByText(/Error de conexión/i)).toBeInTheDocument();
  });

  it('cambiar el período llama a la API con WEEK', async () => {
    render(<Analytics />);
    await screen.findByText('Analítica e Insights');

    fireEvent.click(screen.getByTestId('select-week'));

    expect(apiModule.analyticsAPI.getDashboard).toHaveBeenCalledWith('WEEK');
  });
});
