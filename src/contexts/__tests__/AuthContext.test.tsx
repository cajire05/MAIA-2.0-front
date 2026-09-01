import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { authAPI, usersAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
    authAPI: {
        login: vi.fn(),
        logout: vi.fn(),
    },
    usersAPI: {
        getMe: vi.fn(),
    },
}));

// Test component to access context
const TestComponent = () => {
    const { user, login, logout, isLoading } = useAuth();

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div>
            <div data-testid="user-role">{user ? user.role : 'No User'}</div>
            <div data-testid="user-email">{user ? user.email : 'No Email'}</div>
            <button onClick={() => login('test@u.icesi.edu.co', 'password123')}>Login</button>
            <button onClick={() => logout()}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('use JWT fallback in tests'),
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockToken = (role: string) => {
        // Generate a simple mock JWT containing a specified role
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            email: 'test@u.icesi.edu.co',
            roles: [role]
        }));
        const signature = btoa('signature');
        return `${header}.${payload}.${signature}`;
    };

    it('does not call getMe when there is no stored token', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('No User');
        });
        expect(usersAPI.getMe).not.toHaveBeenCalled();
    });

    it('restores session from JWT without roles array', async () => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ email: 'solo@maia.com' }));
        localStorage.setItem('authToken', `${header}.${payload}.${btoa('sig')}`);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('professor');
            expect(screen.getByTestId('user-email')).toHaveTextContent('solo@maia.com');
        });
    });

    it('restores session from valid JWT on mount', async () => {
        localStorage.setItem('authToken', mockToken('DOCENTE'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Initial state might be loading, then it should resolve
        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('professor');
            expect(screen.getByTestId('user-email')).toHaveTextContent('test@u.icesi.edu.co');
        });
    });

    it('handles invalid JWT properly', async () => {
        localStorage.setItem('authToken', 'invalid.token.here');

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('No User');
            expect(localStorage.getItem('authToken')).toBeNull();
        });
    });

    it('login function calls authAPI and updates state', async () => {
        const mockUser = {
            id: '1',
            idNumber: 'test@u.icesi.edu.co',
            name: 'Test Setup',
            email: 'test@u.icesi.edu.co',
            role: 'professor' as const,
            department: ''
        };

        (authAPI.login as any).mockResolvedValue({
            token: 'fake-token',
            user: mockUser
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        const loginButton = screen.getByText('Login');
        await userEvent.click(loginButton);

        expect(authAPI.login).toHaveBeenCalledWith({
            email: 'test@u.icesi.edu.co',
            password: 'password123'
        });

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('professor');
            expect(screen.getByTestId('user-email')).toHaveTextContent('test@u.icesi.edu.co');
        });
    });

    it('login function returns null on failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            (authAPI.login as any).mockRejectedValue(new Error('Invalid credentials'));

            let loginResult: import('../AuthContext').User | null | undefined;
            const ComponentWithReturn = () => {
                const { login } = useAuth();
                return (
                    <button
                        type="button"
                        onClick={async () => {
                            loginResult = await login('bad@mail.com', 'bad');
                        }}
                    >
                        Try Login
                    </button>
                );
            };

            render(
                <AuthProvider>
                    <ComponentWithReturn />
                </AuthProvider>
            );

            await userEvent.click(screen.getByText('Try Login'));

            await waitFor(() => {
                expect(loginResult).toBeNull();
            });
        } finally {
            consoleSpy.mockRestore();
        }
    });

    it('refreshSession clears session when getMe fails and JWT has no email', async () => {
        localStorage.setItem('authToken', 'not.a.valid.jwt.structure');
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('No User');
            expect(localStorage.getItem('authToken')).toBeNull();
        });
    });

    it('refreshSession uses usersAPI.getMe when token exists', async () => {
        localStorage.setItem('authToken', mockToken('DOCENTE'));
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 'u-99',
            idNumber: 'docente@maia.com',
            name: 'Docente API',
            email: 'docente@maia.com',
            role: 'professor',
            department: 'Ing',
            experienceLevel: 'beginner',
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(usersAPI.getMe).toHaveBeenCalled();
            expect(screen.getByTestId('user-email')).toHaveTextContent('docente@maia.com');
            expect(screen.getByTestId('user-role')).toHaveTextContent('professor');
        });
    });

    it('maps unknown JWT role to department_head on fallback', async () => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            email: 'coord@maia.com',
            roles: ['COORDINADOR'],
        }));
        localStorage.setItem('authToken', `${header}.${payload}.${btoa('sig')}`);
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('department_head');
        });
    });

    it('refreshSession falls back to JWT when getMe fails', async () => {
        localStorage.setItem('authToken', mockToken('JEFE_DEPARTAMENTO'));
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('department_head');
        });
    });

    it('updateProfile merges fields on logged-in user', async () => {
        localStorage.setItem('authToken', mockToken('DOCENTE'));
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: '1',
            idNumber: 'a@b.com',
            name: 'A',
            email: 'a@b.com',
            role: 'professor',
            department: 'Ing',
        });

        const ProfileUpdater = () => {
            const { user, updateProfile } = useAuth();
            return (
                <div>
                    <span data-testid="area">{user?.academicArea ?? 'none'}</span>
                    <button type="button" onClick={() => updateProfile({ academicArea: 'Física' })}>
                        Update
                    </button>
                </div>
            );
        };

        render(
            <AuthProvider>
                <ProfileUpdater />
            </AuthProvider>,
        );

        await waitFor(() => expect(screen.getByTestId('area')).toHaveTextContent('none'));
        await userEvent.click(screen.getByText('Update'));
        expect(screen.getByTestId('area')).toHaveTextContent('Física');
    });

    it('useAuth throws outside provider', () => {
        const Broken = () => {
            useAuth();
            return null;
        };
        expect(() => render(<Broken />)).toThrow(/AuthProvider/);
    });

    it('logout resolves and removes user state', async () => {
        localStorage.setItem('authToken', mockToken('JEFE_DEPARTAMENTO'));
        (usersAPI.getMe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-role')).toHaveTextContent('department_head');
        });

        const logoutButton = screen.getByText('Logout');
        await userEvent.click(logoutButton);

        expect(authAPI.logout).toHaveBeenCalled();
        expect(screen.getByTestId('user-role')).toHaveTextContent('No User');
    });
});
