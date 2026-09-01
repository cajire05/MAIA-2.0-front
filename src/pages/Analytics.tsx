import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart3, TrendingUp, Users, MessageSquare, BookOpen, Loader2 } from 'lucide-react';
import {
  analyticsAPI,
  type DepartmentDashboardDTO,
  type AnalyticsUsageDTO,
  type TopicDTO,
  type AnalyticsPeriod,
} from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PERIOD_MAP: Record<string, AnalyticsPeriod> = {
  week: 'WEEK',
  month: 'MONTH',
  quarter: 'QUARTER',
  year: 'YEAR',
};

export function Analytics() {
  const [timePeriod, setTimePeriod] = useState('month');
  const [dashboard, setDashboard] = useState<DepartmentDashboardDTO | null>(null);
  const [usage, setUsage] = useState<AnalyticsUsageDTO | null>(null);
  const [topics, setTopics] = useState<TopicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const period = PERIOD_MAP[timePeriod] ?? 'MONTH';
    setLoading(true);
    setError(null);

    Promise.all([
      analyticsAPI.getDashboard(period),
      analyticsAPI.getUsage(period),
      analyticsAPI.getTopics(period, 10),
    ])
      .then(([dash, use, top]) => {
        setDashboard(dash);
        setUsage(use);
        setTopics(top);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [timePeriod]);

  const pendingRequests = dashboard?.requestsRecibidas ?? 0;
  const answeredRequests = dashboard?.requestsResueltas ?? 0;
  const totalRequests = pendingRequests + answeredRequests;

  const requestStatusItems = [
    { label: 'Pendientes', count: pendingRequests, barClass: 'bg-orange-500' },
    { label: 'Contestadas', count: answeredRequests, barClass: 'bg-[#5454e9]' },
  ];

  return (
    <div className="p-8 space-y-6" data-tour="analytics-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Analítica e Insights</h1>
          <p className="text-muted-foreground mt-1">
            Rastrea la adopción de integración de IA e identifica las necesidades del profesorado
          </p>
        </div>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px] border-2 border-[#f5f7fb]" data-testid="analytics-period-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mes</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="year">Último Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5454e9]/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#5454e9]" />
              </div>
              <div>
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.totalUsers ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Profesores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.activeUsers ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Profesores Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5454e9]/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-[#5454e9]" />
              </div>
              <div>
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.chatInteractions ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Sesiones de chat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
                  <p className="text-2xl">{dashboard?.requestsRecibidas ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Solicitudes pendientes</p>
                {!loading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contestadas: {dashboard?.requestsResueltas ?? 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trend — Recharts LineChart */}
      <Card className="border-2 border-[#f5f7fb]">
        <CardHeader>
          <CardTitle>Tendencia de Uso</CardTitle>
          <CardDescription>Interacciones del chatbot a lo largo del tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : usage && usage.dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={usage.dataPoints} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f7fb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [value, 'Interacciones']}
                  labelFormatter={(label: string) => `Fecha: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#5454e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No hay datos de uso para el período seleccionado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests + Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-[#f5f7fb]">
          <CardHeader>
            <CardTitle>Estado de Solicitudes</CardTitle>
            <CardDescription>Distribución por estado de las solicitudes de apoyo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {requestStatusItems.map((item) => {
                  const percent =
                    totalRequests > 0 ? Math.round((item.count / totalRequests) * 100) : 0;
                  const barWidth =
                    item.count > 0 && totalRequests > 0
                      ? Math.max(percent, 4)
                      : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.barClass} rounded-full transition-all`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#f5f7fb]">
          <CardHeader>
            <CardTitle>Temas Más Populares</CardTitle>
            <CardDescription>Palabras clave más frecuentes en las consultas del chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topics.length > 0 ? (
              <div className="space-y-4">
                {topics.map((topic, index) => {
                  const maxCount = topics[0].count;
                  const percentage = (topic.count / maxCount) * 100;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm capitalize">{topic.topic}</span>
                        <span className="text-sm text-muted-foreground">{topic.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5454e9] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No hay consultas registradas en este período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      {!loading && dashboard && (
        <Card className="border-2 border-[#f5f7fb]">
          <CardHeader>
            <CardTitle>Resumen de Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-[#5454e9]/5 rounded-lg border-2 border-[#5454e9]/20">
              <TrendingUp className="h-5 w-5 text-[#5454e9] mt-0.5" />
              <p className="text-sm">
                <strong>Adopción:</strong>{' '}
                {dashboard.totalUsers > 0
                  ? `${((dashboard.activeUsers / dashboard.totalUsers) * 100).toFixed(0)}% de los profesores del departamento han usado el chatbot en este período.`
                  : 'No hay profesores registrados en el departamento.'}
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#5454e9]/5 rounded-lg border-2 border-[#5454e9]/20">
              <MessageSquare className="h-5 w-5 text-[#5454e9] mt-0.5" />
              <p className="text-sm">
                <strong>Promedio de chats:</strong>{' '}
                {dashboard.activeUsers > 0
                  ? `${(dashboard.chatInteractions / dashboard.activeUsers).toFixed(1)} interacciones por profesor activo.`
                  : 'Sin interacciones en este período.'}
              </p>
            </div>
            {topics[0] && (
              <div className="flex items-start gap-3 p-3 bg-[#5454e9]/5 rounded-lg border-2 border-[#5454e9]/20">
                <BarChart3 className="h-5 w-5 text-[#5454e9] mt-0.5" />
                <p className="text-sm">
                  <strong>Tema principal:</strong>{' '}
                  El término <span className="capitalize font-medium">"{topics[0].topic}"</span> aparece con mayor frecuencia en las consultas del departamento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
