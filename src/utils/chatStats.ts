import { chatAPI } from '../services/api';

/** Cuenta hilos de conversación distintos del historial del usuario (misma fuente que Historial IA). */
export async function getChatSessionCount(): Promise<number> {
  const first = await chatAPI.getMyInteractions({ page: 0, size: 1 });
  if (first.totalElements === 0) return 0;

  const conversationIds = new Set<string>();
  let page = 0;
  const size = 100;

  do {
    const data = await chatAPI.getMyInteractions({ page, size });
    for (const interaction of data.content) {
      if (interaction.conversationId) {
        conversationIds.add(interaction.conversationId);
      }
    }
    page += 1;
    if (page >= data.totalPages) break;
  } while (true);

  return conversationIds.size;
}
