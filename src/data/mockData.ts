export interface Resource {
  authorId?: string;
  activityType: string;
  id: string;
  title: string;
  description: string;
  type: 'case_study' | 'example' | 'best_practice' | 'guide';
  level: 'beginner' | 'intermediate' | 'advanced';
  aiasLevel?: 'nivel_1' | 'nivel_2' | 'nivel_3' | 'nivel_4' | 'nivel_5';
  discipline: string;
  activity: string;
  dateAdded: string;
  url?: string;
  attachmentPath?: string;
  isFavorite?: boolean;
}

export interface SupportRequest {
  id: string;
  professorId: string;
  professorName: string;
  type: 'technical' | 'pedagogical' | 'strategic' | 'other';
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  response?: string;
  respondedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Usando ChatGPT para Retroalimentación de Ensayos',
    description: 'Un estudio de caso integral sobre la implementación de retroalimentación asistida por IA en cursos de composición.',
    type: 'case_study',
    level: 'beginner',
    aiasLevel: 'nivel_2',
    discipline: 'Literatura',
    activity: 'Escritura',
    activityType: 'Escritura',
    dateAdded: '2025-09-15'
  },
  {
    id: '2',
    title: 'Conjuntos de Problemas Generados por IA en Matemáticas',
    description: 'Mejores prácticas para usar IA generativa para crear conjuntos diversos de problemas para estudiantes de cálculo.',
    type: 'best_practice',
    level: 'intermediate',
    aiasLevel: 'nivel_3',
    discipline: 'Matemáticas',
    activity: 'Resolución de Problemas',
    activityType: 'Resolución de Problemas',
    dateAdded: '2025-09-20'
  },
  {
    id: '3',
    title: 'Consideraciones Éticas en la Educación Asistida por IA',
    description: 'Una guía para navegar los desafíos éticos al integrar herramientas de IA en el aula.',
    type: 'guide',
    level: 'beginner',
    aiasLevel: 'nivel_1',
    discipline: 'Todas las Disciplinas',
    activity: 'General',
    activityType: 'General',
    dateAdded: '2025-09-10'
  },
  {
    id: '4',
    title: 'Revisión de Código con Asistentes de IA',
    description: 'Implementaciones de ejemplo de revisión de código impulsada por IA en cursos de programación.',
    type: 'example',
    level: 'advanced',
    aiasLevel: 'nivel_4',
    discipline: 'Ciencias de la Computación',
    activity: 'Programación',
    activityType: 'Programación',
    dateAdded: '2025-09-25'
  },
  {
    id: '5',
    title: 'Rutas de Aprendizaje Personalizadas con IA',
    description: 'Estudio de caso sobre la creación de experiencias de aprendizaje adaptativas usando IA generativa en cursos STEM.',
    type: 'case_study',
    level: 'advanced',
    aiasLevel: 'nivel_5',
    discipline: 'STEM',
    activity: 'Evaluación',
    activityType: 'Evaluación',
    dateAdded: '2025-09-18'
  },
  {
    id: '6',
    title: 'IA para Actividades de Aprendizaje de Idiomas',
    description: 'Ejemplos prácticos del uso de IA para generar práctica de conversación y ejercicios de gramática.',
    type: 'example',
    level: 'beginner',
    aiasLevel: 'nivel_2',
    discipline: 'Idiomas',
    activity: 'Comunicación',
    activityType: 'Comunicación',
    dateAdded: '2025-09-12'
  }
];

export const MOCK_REQUESTS: SupportRequest[] = [
  {
    id: '1',
    professorId: '2',
    professorName: 'Yovanna Aguilar',
    type: 'pedagogical',
    description: 'Necesito ayuda para diseñar un proceso de revisión por pares asistido por IA para mi curso de ingeniería de software. Los estudiantes están trabajando en proyectos en equipo y quiero usar IA para proporcionar retroalimentación inicial antes de las revisiones entre pares.',
    urgency: 'medium',
    status: 'in_progress',
    createdAt: '2025-10-05T10:30:00Z',
    response: 'Recomiendo comenzar con una rúbrica estructurada que la IA pueda seguir. Programemos una reunión para discutir los resultados de aprendizaje específicos que deseas evaluar. He preparado algunos ejemplos que podemos revisar juntos.'
  },
  {
    id: '2',
    professorId: '3',
    professorName: 'Dr. Maria Rodriguez',
    type: 'technical',
    description: '¿Cómo puedo integrar la API de ChatGPT en mi sistema de gestión de cursos para proporcionar a los estudiantes tutoría bajo demanda para problemas de cálculo?',
    urgency: 'high',
    status: 'pending',
    createdAt: '2025-10-06T14:15:00Z'
  },
  {
    id: '3',
    professorId: '2',
    professorName: 'Yovanna Aguilar',
    type: 'strategic',
    description: 'Busco orientación para desarrollar un plan semestral para introducir gradualmente herramientas de IA a estudiantes que nunca las han usado antes.',
    urgency: 'low',
    status: 'resolved',
    createdAt: '2025-09-28T09:00:00Z',
    response: 'Aquí está un enfoque por fases: Semana 1-2: Introducción a las capacidades y limitaciones de la IA. Semana 3-4: Lluvia de ideas asistida por IA guiada. Semana 5-8: IA para investigación y síntesis de información. Semana 9-12: Aplicaciones avanzadas. He adjuntado un documento detallado con la línea de tiempo.',
    respondedAt: '2025-09-29T11:30:00Z'
  }
];

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'How can I use AI to help students with debugging in my programming course?',
    timestamp: '2025-10-05T09:00:00Z'
  },
  {
    id: '2',
    role: 'assistant',
    content: 'There are several effective approaches to using AI for debugging assistance in programming courses:\n\n1. **Guided Error Analysis**: Have students paste their error messages and code into an AI tool, but require them to explain what the AI\'s suggestions mean before implementing them.\n\n2. **Rubber Duck Debugging with AI**: Encourage students to explain their code and logic to the AI, which helps them think through their approach.\n\n3. **Pattern Recognition**: Use AI to help students identify common error patterns in their code and learn to recognize these patterns independently.\n\nWould you like specific examples for any of these approaches?',
    timestamp: '2025-10-05T09:00:30Z'
  },
  {
    id: '3',
    role: 'user',
    content: 'Yes, I\'d like examples of the guided error analysis approach.',
    timestamp: '2025-10-05T09:02:00Z'
  },
  {
    id: '4',
    role: 'assistant',
    content: 'Here\'s a practical framework for guided error analysis:\n\n**Step 1: Student Submission Template**\n- Error message (copy-paste)\n- Relevant code snippet\n- What they\'ve already tried\n- Their hypothesis about the cause\n\n**Step 2: AI Interaction**\n- Students use ChatGPT or similar to analyze the error\n- They must screenshot or save the AI\'s response\n\n**Step 3: Reflection Document**\n- Students write: "The AI suggested X because Y"\n- They explain the underlying concept\n- They document what they learned\n\nThis ensures students engage critically with AI suggestions rather than blindly copying solutions. You could make the reflection document worth 10-15% of the assignment grade.',
    timestamp: '2025-10-05T09:02:45Z'
  }
];

export const MOCK_ANALYTICS = {
  totalUsers: 45,
  activeThisWeek: 32,
  totalResources: 127,
  totalRequests: 18,
  pendingRequests: 5,
  chatInteractions: 234,
  topTopics: [
    { topic: 'Diseño de Evaluación', count: 45 },
    { topic: 'Asistencia de Escritura', count: 38 },
    { topic: 'Revisión de Código', count: 32 },
    { topic: 'Generación de Retroalimentación', count: 28 },
    { topic: 'Creación de Contenido', count: 24 }
  ],
  usageByWeek: [
    { week: 'Semana 1', interactions: 42 },
    { week: 'Semana 2', interactions: 55 },
    { week: 'Semana 3', interactions: 48 },
    { week: 'Semana 4', interactions: 67 },
    { week: 'Semana 5', interactions: 89 }
  ],
  requestsByType: [
    { type: 'Pedagógica', count: 8 },
    { type: 'Técnica', count: 5 },
    { type: 'Estratégica', count: 3 },
    { type: 'Otra', count: 2 }
  ]
};

export const FAQ_QUESTIONS = [
  '¿Cómo puedo usar IA para crear preguntas de evaluación diversas?',
  '¿Cuáles son las mejores prácticas para calificación asistida por IA?',
  '¿Cómo abordo la integridad académica con herramientas de IA?',
  '¿Puede la IA ayudar con rutas de aprendizaje personalizadas?',
  '¿Cómo usar IA para proporcionar retroalimentación de escritura?'
];
