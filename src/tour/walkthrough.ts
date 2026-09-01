import type { ReactNode } from 'react';

export type WalkthroughRole = 'professor' | 'department_head';

export type WalkthroughStep = {
  route: string;
  selector: string;
  title: string;
  description: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

const sidebarIntro: WalkthroughStep[] = [
  {
    route: '/dashboard',
    selector: '[data-tour="sidebar-logo"]',
    title: 'Bienvenido a MAIA',
    description:
      'Este recorrido te mostrará las secciones principales. Usa «Siguiente» o haz clic fuera del recuadro para continuar.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-dashboard"]',
    title: 'Inicio',
    description: 'Resumen de tu actividad, accesos rápidos y novedades recientes.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-library"]',
    title: 'Biblioteca',
    description: 'Explora recursos y estrategias para integrar IA en tus cursos.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-collections"]',
    title: 'Colecciones',
    description: 'Organiza tus recursos favoritos en colecciones personalizadas.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-profile"]',
    title: 'Perfil',
    description: 'Configura preferencias y vuelve a abrir este tutorial cuando quieras.',
    side: 'right',
  },
];

const professorSidebar: WalkthroughStep[] = [
  {
    route: '/dashboard',
    selector: '[data-tour="nav-my-resources"]',
    title: 'Mis recursos',
    description: 'Publica y administra los recursos que compartes con la comunidad.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-support"]',
    title: 'Solicitar apoyo',
    description: 'Pide ayuda al equipo cuando necesites orientación especializada.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-surveys"]',
    title: 'Encuestas',
    description: 'Responde encuestas de satisfacción para mejorar la plataforma.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-notifications"]',
    title: 'Notificaciones',
    description: 'Revisa recordatorios, encuestas pendientes y avisos importantes.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-chat-history"]',
    title: 'Historial IA',
    description: 'Consulta conversaciones previas con el asistente de enseñanza.',
    side: 'right',
  },
];

const departmentHeadSidebar: WalkthroughStep[] = [
  {
    route: '/dashboard',
    selector: '[data-tour="nav-requests"]',
    title: 'Solicitudes',
    description: 'Gestiona y responde solicitudes de apoyo del equipo docente.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-analytics"]',
    title: 'Analítica',
    description: 'Indicadores de uso y adopción de la plataforma en tu departamento.',
    side: 'right',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="nav-chat-history-admin"]',
    title: 'Historial IA (usuarios)',
    description: 'Revisa interacciones de docentes con el asistente cuando lo necesites.',
    side: 'right',
  },
];

const professorPages: WalkthroughStep[] = [
  {
    route: '/dashboard',
    selector: '[data-tour="dashboard-quick-actions"]',
    title: 'Acciones rápidas',
    description: 'Atajos para iniciar un chat, explorar la biblioteca o solicitar apoyo.',
    side: 'bottom',
  },
  {
    route: '/dashboard',
    selector: '[data-tour="chatbot-fab"]',
    title: 'Asistente IA',
    description: 'Botón flotante para abrir el chat y recibir orientación pedagógica al instante.',
    side: 'left',
  },
  {
    route: '/library',
    selector: '[data-tour="library-filters"]',
    title: 'Filtros de búsqueda',
    description: 'Filtra por experiencia con IA, nivel AIAS y tipo de actividad.',
    side: 'bottom',
  },
  {
    route: '/library',
    selector: '[data-tour="library-first-card"]',
    title: 'Recursos',
    description: 'Abre un recurso para ver detalle, URL, adjuntos y agregarlo a colecciones.',
    side: 'top',
  },
  {
    route: '/collections',
    selector: '[data-tour="collections-list"]',
    title: 'Colecciones',
    description: 'Crea colecciones y organiza los recursos que más usas.',
    side: 'top',
  },
  {
    route: '/profile',
    selector: '[data-tour="profile-tutorial-button"]',
    title: 'Reabrir el tutorial',
    description: 'Puedes volver a ver este recorrido cuando quieras desde este botón.',
    side: 'bottom',
  },
];

const departmentHeadPages: WalkthroughStep[] = [
  {
    route: '/analytics',
    selector: '[data-tour="analytics-content"]',
    title: 'Panel de analítica',
    description: 'Explora gráficos e indicadores del uso de MAIA en tu departamento.',
    side: 'bottom',
  },
  {
    route: '/requests',
    selector: '[data-tour="requests-content"]',
    title: 'Gestión de solicitudes',
    description: 'Filtra, abre y responde solicitudes de apoyo de los docentes.',
    side: 'bottom',
  },
  {
    route: '/library',
    selector: '[data-tour="library-filters"]',
    title: 'Biblioteca',
    description: 'Consulta el catálogo de recursos disponibles para el departamento.',
    side: 'bottom',
  },
  {
    route: '/collections',
    selector: '[data-tour="collections-list"]',
    title: 'Colecciones',
    description: 'Organiza recursos en listas para compartir o consultar después.',
    side: 'top',
  },
  {
    route: '/profile',
    selector: '[data-tour="profile-tutorial-button"]',
    title: 'Reabrir el tutorial',
    description: 'Puedes volver a ver este recorrido cuando quieras desde este botón.',
    side: 'bottom',
  },
];

const adminSurveyStep: WalkthroughStep = {
  route: '/admin/surveys',
  selector: '[data-tour="admin-surveys-content"]',
  title: 'Encuestas (administración)',
  description: 'Crea plantillas, genera instancias y revisa reportes de encuestas.',
  side: 'bottom',
};

export function getWalkthroughSteps(
  role: WalkthroughRole,
  isAdministrator?: boolean,
): WalkthroughStep[] {
  if (role === 'professor') {
    return [...sidebarIntro, ...professorSidebar, ...professorPages];
  }

  const headSteps = [
    ...sidebarIntro,
    ...departmentHeadSidebar,
    ...departmentHeadPages,
  ];
  if (isAdministrator) {
    // Insertar encuestas admin antes del paso final de perfil
    const profileIdx = headSteps.findIndex((s) => s.route === '/profile');
    if (profileIdx >= 0) {
      return [
        ...headSteps.slice(0, profileIdx),
        adminSurveyStep,
        ...headSteps.slice(profileIdx),
      ];
    }
    return [...headSteps, adminSurveyStep];
  }
  return headSteps;
}
