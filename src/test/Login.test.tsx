import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Login } from '../pages/Login';

// Mock AuthContext
vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: vi.fn(),
    };
});

// Mock react-router-dom to intercept navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockDashboardUser = {
    id: '1',
    idNumber: '1',
    name: 'Test User',
    email: 'test@u.icesi.edu.co',
    role: 'department_head' as const,
    department: 'Ingeniería',
};

describe('Login Component', () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            login: mockLogin,
            user: null,
            isLoading: false
        });
    });

    const renderLogin = () => {
        return render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
    };

    it('renders login form correctly', () => {
        renderLogin();

        expect(screen.getByText('MAIA')).toBeInTheDocument();
        expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    });

    it('handles user input and submits login successfully', async () => {
        mockLogin.mockResolvedValue(mockDashboardUser);

        renderLogin();

        const emailInput = screen.getByLabelText(/Correo Electrónico/i);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

        await userEvent.type(emailInput, 'test@u.icesi.edu.co');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(submitButton);

        expect(mockLogin).toHaveBeenCalledWith('test@u.icesi.edu.co', 'password123');

        // Should navigate to dashboard on success
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('displays error message on invalid credentials', async () => {
        mockLogin.mockResolvedValue(null);

        renderLogin();

        const emailInput = screen.getByLabelText(/Correo Electrónico/i);
        const passwordInput = screen.getByLabelText(/Contraseña/i);
        const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

        await userEvent.type(emailInput, 'wrong@u.icesi.edu.co');
        await userEvent.type(passwordInput, 'wrong');
        await userEvent.click(submitButton);

        expect(mockLogin).toHaveBeenCalledWith('wrong@u.icesi.edu.co', 'wrong');

        // Navigation should not be called
        expect(mockNavigate).not.toHaveBeenCalled();

        // Error message should be rendered
        await waitFor(() => {
            expect(screen.getByText(/Correo o contraseña inválidos/i)).toBeInTheDocument();
        });
    });

    it('displays generic error text when login throws exception', async () => {
        mockLogin.mockRejectedValue(new Error('Network error connecting'));

        renderLogin();

        await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@u.icesi.edu.co');
        await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

        await waitFor(() => {
            expect(screen.getByText(/Network error connecting/i)).toBeInTheDocument();
        });
    });

    it('disables submit button and shows loading text while authenticating', async () => {
        mockLogin.mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(() => resolve(mockDashboardUser), 200),
                ),
        );

        renderLogin();

        const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

        await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@u.icesi.edu.co');
        await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password123');

        // Fire event but don't await yet
        userEvent.click(submitButton);

        await waitFor(() => {
            expect(submitButton).toBeDisabled();
            expect(submitButton).toHaveTextContent(/Iniciando sesión.../i);
        });
    });
});
