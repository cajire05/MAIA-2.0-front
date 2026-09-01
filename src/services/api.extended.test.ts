import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  authAPI,
  departmentsAPI,
  usersAPI,
  resourcesAPI,
  favoritesAPI,
  favoriteListsAPI,
  surveysAPI,
  supportRequestsAPI,
  notificationsAPI,
  chatAPI,
  mapBackendUserToFrontend,
  isSurveyNotification,
  type BackendUserProfile,
} from './api';

const originalFetch = global.fetch;

function mockStorage(token: string | null = 'test-token') {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => token),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    length: 0,
    clear: vi.fn(),
    key: vi.fn(() => null),
  } satisfies Storage);
}

function mockOk(body: unknown, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

describe('api extended coverage', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    mockStorage();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('mapBackendUserToFrontend', () => {
    it('maps docente with experience and admin flag', () => {
      const user = mapBackendUserToFrontend({
        id: 'u1',
        name: 'Ana',
        email: 'ana@maia.com',
        roles: ['DOCENTE', 'ADMINISTRADOR'],
        department: { id: 'd1', name: 'Ing' },
        levelExperienceAIG: 'Intermedio',
        academicArea: '  Matemáticas ',
      });

      expect(user.role).toBe('professor');
      expect(user.department).toBe('Ing');
      expect(user.experienceLevel).toBe('intermediate');
      expect(user.academicArea).toBe('Matemáticas');
      expect(user.isAdministrator).toBe(true);
    });

    it('maps unknown backend role to department_head', () => {
      const user = mapBackendUserToFrontend({
        id: 'x',
        name: 'X',
        email: 'x@maia.com',
        roles: ['COORDINADOR'],
      });
      expect(user.role).toBe('department_head');
    });

    it('maps unknown experience level to undefined', () => {
      const user = mapBackendUserToFrontend({
        id: 'u1',
        name: 'A',
        email: 'a@maia.com',
        roles: ['DOCENTE'],
        levelExperienceAIG: 'Experto',
      });
      expect(user.experienceLevel).toBeUndefined();
    });

    it('maps jefe de departamento role', () => {
      const user = mapBackendUserToFrontend({
        id: 'j1',
        name: 'Jefe',
        email: 'jefe@maia.com',
        roles: ['JEFE_DEPARTAMENTO'],
        department: null,
      });

      expect(user.role).toBe('department_head');
      expect(user.department).toBe('');
    });
  });

  describe('isSurveyNotification', () => {
    it('returns true for survey types only', () => {
      expect(isSurveyNotification('SURVEY_AVAILABLE')).toBe(true);
      expect(isSurveyNotification('SURVEY_REMINDER')).toBe(true);
      expect(isSurveyNotification('REQUEST_RESPONDED')).toBe(false);
    });
  });

  describe('authAPI', () => {
    it('login stores token and maps user', async () => {
      const backendUser: BackendUserProfile = {
        id: 'u1',
        name: 'Test',
        email: 't@maia.com',
        roles: ['DOCENTE'],
        department: { id: 'd1', name: 'Dept' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ token: 'jwt-123', user: backendUser }),
      );

      const res = await authAPI.login({ email: 't@maia.com', password: 'x' });

      expect(res.token).toBe('jwt-123');
      expect(res.user.email).toBe('t@maia.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'jwt-123');
    });

    it('register posts payload', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));

      await authAPI.register({
        email: 'n@maia.com',
        password: 'secret',
        name: 'Nuevo',
        roleNames: [],
        departmentId: 'd1',
      });

      const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(options?.method).toBe('POST');
      expect((options?.body as string)).toContain('n@maia.com');
    });

    it('logout removes token', () => {
      authAPI.logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('departmentsAPI & usersAPI', () => {
    it('departmentsAPI.getAll', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk([{ id: 'd1', name: 'Ing' }]),
      );
      const depts = await departmentsAPI.getAll();
      expect(depts).toHaveLength(1);
    });

    it('usersAPI profile endpoints', async () => {
      const profile: BackendUserProfile = {
        id: 'u1',
        name: 'U',
        email: 'u@maia.com',
        roles: ['DOCENTE'],
        academicArea: 'Física',
        levelExperienceAIG: 'Avanzado',
      };
      const profileBeginner: BackendUserProfile = {
        ...profile,
        academicArea: 'Química',
        levelExperienceAIG: 'Principiante',
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockOk(profile))
        .mockResolvedValueOnce(mockOk(profile))
        .mockResolvedValueOnce(mockOk(profileBeginner));

      const me = await usersAPI.getMe();
      expect(me.academicArea).toBe('Física');
      expect(me.experienceLevel).toBe('advanced');

      const updatedDept = await usersAPI.updateMyDepartment('dept-2');
      expect(updatedDept).toBeDefined();

      const updatedProfile = await usersAPI.updateMyProfilePreferences({
        academicArea: 'Química',
        levelExperienceAIG: 'Principiante',
      });
      expect(updatedProfile.experienceLevel).toBe('beginner');
      expect(updatedProfile.academicArea).toBe('Química');
    });
  });

  describe('resourcesAPI', () => {
    it('covers CRUD and filter helpers', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await resourcesAPI.getAll();
      await resourcesAPI.getById('r1');
      await resourcesAPI.getMyResources();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await resourcesAPI.getFiltered('all', 'all', 'all');
      await resourcesAPI.getFiltered('beginner', 'math', 'quiz');

      let url = '';
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((u: string, opts?: RequestInit) => {
        url = u;
        return mockOk({ id: 'r1' });
      });
      await resourcesAPI.create({ title: 'T' });
      expect(url).toContain('/api/library/resources');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));
      await resourcesAPI.update('r1', { title: 'X' });
      await resourcesAPI.delete('r1');

      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({ path: '/p' }));
      const uploaded = await resourcesAPI.uploadAttachment('r1', file);
      expect(uploaded.path).toBe('/p');
    });
  });

  describe('supportRequestsAPI extra', () => {
    it('admin.getStats with department filter', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ recibidas: 1, contestadas: 2 }),
      );

      await supportRequestsAPI.admin.getStats('dept-9');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/requests/stats?departmentId=dept-9',
        expect.any(Object),
      );
    });

    it('create, getById and getMyRequests', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));
      await supportRequestsAPI.create({
        requesterId: 'u1',
        title: 'T',
        description: 'D',
        priority: 'ALTA',
        contactEmail: 'e@e.com',
        contactPhone: '1',
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 'r1', title: 'T', status: 'RECIBIDA' }),
      );
      const detail = await supportRequestsAPI.getById('r1');
      expect(detail.id).toBe('r1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      const mine = await supportRequestsAPI.getMyRequests('u1');
      expect(mine).toEqual([]);
    });
  });

  describe('favoritesAPI & favoriteListsAPI', () => {
    it('favorites endpoints', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ resourceId: 'r1', isFavorite: true, message: 'ok' }),
      );
      await favoritesAPI.toggle('r1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await favoritesAPI.getAll();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ resourceId: 'r1', isFavorite: false }),
      );
      await favoritesAPI.getStatus('r1');
    });

    it('favorite lists CRUD', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 'l1', name: 'Lista' }),
      );
      await favoriteListsAPI.create('Lista');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await favoriteListsAPI.getAll();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 'l1', name: 'Lista', resources: [] }),
      );
      await favoriteListsAPI.getDetail('l1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 'l1', name: 'Nueva' }),
      );
      await favoriteListsAPI.updateName('l1', 'Nueva');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));
      await favoriteListsAPI.delete('l1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 'l1', name: 'Nueva', resources: [] }),
      );
      await favoriteListsAPI.addResource('l1', 'r1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));
      await favoriteListsAPI.removeResource('l1', 'r1');
    });
  });

  describe('surveysAPI', () => {
    it('teacher and admin survey endpoints', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await surveysAPI.getPending();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));
      await surveysAPI.respond('inv-1', [{ questionId: 'q1', ratingValue: 5 }]);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await surveysAPI.admin.listTemplates();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 't1', name: 'T', active: true, intervalDays: 7, questions: [], createdAt: '', updatedAt: '' }),
      );
      await surveysAPI.admin.getTemplate('t1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 't1', name: 'T', active: true, intervalDays: 7, questions: [], createdAt: '', updatedAt: '' }),
      );
      await surveysAPI.admin.createTemplate({
        name: 'Nueva',
        questions: [{ text: 'Q', questionType: 'RATING', sortOrder: 0, required: true }],
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({ id: 't1', name: 'T', active: false, intervalDays: 14, questions: [], createdAt: '', updatedAt: '' }),
      );
      await surveysAPI.admin.updateTemplate('t1', {
        name: 'T',
        active: false,
        intervalDays: 14,
        questions: [],
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk({}));
      await surveysAPI.admin.deleteTemplate('t1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([]));
      await surveysAPI.admin.listInstances();

      let genUrl = '';
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        genUrl = url;
        return mockOk({
          id: 'i1',
          templateId: 't1',
          templateName: 'T',
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
      await surveysAPI.admin.generateInstance('t1', 'dept-1');
      expect(genUrl).toContain('departmentId=dept-1');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({
          instanceId: 'i1',
          title: 'E',
          templateName: 'T',
          opensAt: '',
          closesAt: '',
          totalInvitations: 1,
          completedInvitations: 0,
          responseRatePercent: 0,
          averageSatisfaction: 0,
          ratingDistribution: {},
          questionMetrics: [],
        }),
      );
      await surveysAPI.admin.getReport('i1');
    });
  });

  describe('chatAPI pagination', () => {
    it('normalizes paginated responses with items alias', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({
          items: [
            {
              id: '1',
              conversationId: 'c',
              userId: 'u',
              question: 'Q',
              answer: 'A',
              sequenceNumber: 1,
              createdAt: '2026-01-01',
            },
          ],
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        }),
      );

      const page = await chatAPI.getMyInteractions({ page: 0, size: 10 });
      expect(page.content).toHaveLength(1);
    });

    it('normalizes array responses', async () => {
      const interaction = {
        id: '1',
        conversationId: 'c',
        userId: 'u',
        question: 'Q',
        answer: 'A',
        sequenceNumber: 1,
        createdAt: '2026-01-01',
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk([interaction]));

      const page = await chatAPI.getUserInteractions('u1', { page: 0, size: 10 });
      expect(page.content).toHaveLength(1);
      expect(page.totalElements).toBe(1);
    });

    it('getUserInteractions builds all query params', async () => {
      let url = '';
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((u: string) => {
        url = u;
        return mockOk({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 });
      });

      await chatAPI.getUserInteractions('user-1', {
        conversationId: 'conv-9',
        fromDate: '2024-02-01',
        toDate: '2024-02-28',
        page: 2,
        size: 25,
      });

      expect(url).toContain('conversationId=conv-9');
      expect(url).toContain('fromDate=2024-02-01');
      expect(url).toContain('toDate=2024-02-28');
      expect(url).toContain('page=2');
      expect(url).toContain('size=25');
    });

    it('getUserInteractionsByEmail without optional filters', async () => {
      let url = '';
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((u: string) => {
        url = u;
        return mockOk({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 });
      });

      await chatAPI.getUserInteractionsByEmail('  docente@maia.com  ');
      expect(url).toContain(encodeURIComponent('docente@maia.com'));
      expect(url).not.toContain('conversationId');
    });

    it('getUserInteractionsByEmail with all filters', async () => {
      let url = '';
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((u: string) => {
        url = u;
        return mockOk({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 });
      });

      await chatAPI.getUserInteractionsByEmail('docente@maia.com', {
        conversationId: 'conv-x',
        fromDate: '2024-03-01',
        toDate: '2024-03-31',
        page: 3,
        size: 15,
      });

      expect(url).toContain('conversationId=conv-x');
      expect(url).toContain('fromDate=2024-03-01');
      expect(url).toContain('toDate=2024-03-31');
      expect(url).toContain('page=3');
      expect(url).toContain('size=15');
    });

    it('getInteractionById', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockOk({
          id: '1',
          conversationId: 'c',
          userId: 'u',
          question: 'Q',
          answer: 'A',
          sequenceNumber: 1,
          createdAt: '2026-01-01',
        }),
      );
      const item = await chatAPI.getInteractionById('1');
      expect(item.id).toBe('1');
    });
  });

  describe('notificationsAPI', () => {
    it('getAll, unread count, read and unread toggles', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockOk([{ id: 'n1', userId: 'u1', title: 'T', message: 'M', type: 'GENERIC', isRead: false, createdAt: '' }]))
        .mockResolvedValueOnce(mockOk({ count: 2 }))
        .mockResolvedValueOnce(mockOk(null))
        .mockResolvedValueOnce(mockOk(null))
        .mockResolvedValueOnce(mockOk(null));

      const list = await notificationsAPI.getAll('u1');
      expect(list).toHaveLength(1);
      const unread = await notificationsAPI.getUnreadCount('u1');
      expect(unread.count).toBe(2);
      await notificationsAPI.markAsRead('n1');
      await notificationsAPI.markAsUnread('n1');
      await notificationsAPI.markAllAsRead('u1');
    });
  });

  describe('surveysAPI', () => {
    it('getPending and respond', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockOk([]))
        .mockResolvedValueOnce(mockOk(null));

      await surveysAPI.getPending();
      await surveysAPI.respond('inv-1', [{ questionId: 'q1', ratingValue: 5 }]);
    });

    it('admin template CRUD and generate', async () => {
      const tpl = {
        id: 't1',
        name: 'T',
        active: true,
        intervalDays: 7,
        createdAt: '',
        updatedAt: '',
        questions: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockOk([tpl]))
        .mockResolvedValueOnce(mockOk(tpl))
        .mockResolvedValueOnce(mockOk(tpl))
        .mockResolvedValueOnce(mockOk(tpl))
        .mockResolvedValueOnce(mockOk(null))
        .mockResolvedValueOnce(mockOk({ id: 'i1', templateId: 't1', templateName: 'T', title: 'E', status: 'ACTIVE', opensAt: '', closesAt: '', remindersSent: 0, createdAt: '', totalInvitations: 0, completedInvitations: 0 }))
        .mockResolvedValueOnce(mockOk([]))
        .mockResolvedValueOnce(mockOk({ instanceId: 'i1', title: 'E', templateName: 'T', opensAt: '', closesAt: '', totalInvitations: 0, completedInvitations: 0, responseRatePercent: 0, averageSatisfaction: 0, ratingDistribution: {}, questionMetrics: [] }));

      await surveysAPI.admin.listTemplates();
      await surveysAPI.admin.getTemplate('t1');
      await surveysAPI.admin.createTemplate({ name: 'N', active: true, intervalDays: 7, questions: [] });
      await surveysAPI.admin.updateTemplate('t1', { name: 'N2', active: true, intervalDays: 7, questions: [] });
      await surveysAPI.admin.deleteTemplate('t1');
      await surveysAPI.admin.generateInstance('t1', 'dept-1');
      await surveysAPI.admin.listInstances();
      await surveysAPI.admin.getReport('i1');
    });
  });

  describe('resourcesAPI delete', () => {
    it('delete resource by id', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOk(null, 204));
      await resourcesAPI.delete('res-9');
    });
  });

  describe('apiRequest error paths', () => {
    it('removes token on 401', async () => {
      mockStorage('stale');
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Unauthorized' }),
        text: () => Promise.resolve(''),
      });

      await expect(departmentsAPI.getAll()).rejects.toThrow();
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('throws connection error on Failed to fetch', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new TypeError('Failed to fetch'),
      );

      await expect(departmentsAPI.getAll()).rejects.toThrow(
        /No se pudo conectar con el servidor/,
      );
    });

    it('uses error field when message is absent', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
        json: () => Promise.resolve({ error: 'Fallo interno' }),
        text: () => Promise.resolve(''),
      });

      await expect(departmentsAPI.getAll()).rejects.toThrow('Fallo interno');
    });

    it('parses validation errors from backend', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({ errors: { email: 'Correo inválido' } }),
        text: () => Promise.resolve(''),
      });

      await expect(departmentsAPI.getAll()).rejects.toThrow('Correo inválido');
    });
  });
});
