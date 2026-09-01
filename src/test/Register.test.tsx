import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Register } from '../pages/Register';
import { toast } from 'sonner';

// Mock AuthContext
vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: vi.fn(),
    };
});

// Mock authAPI
vi.mock('../services/api', () => ({
    authAPI: {
        register: vi.fn(),
    },
    departmentsAPI: {
        getAll: vi.fn().mockResolvedValue([{ id: 'dept-1', name: 'Departamento de Ingeniería' }]),
    },
}));

// Mock react-router-dom to intercept navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock Select component because Radix UI Select is notoriously hard to test in JSDOM
// We provide a simplified interactive version focusing on basic events
vi.mock('../components/ui/select', () => ({
    Select: ({ onValueChange, children, 'data-testid': testId }: any) => (
        <div data-testid={testId ?? 'role-select'}>
            {children}
            {testId === 'department-select' ? (
                <button
                    data-testid="select-dept"
                    type="button"
                    onClick={() => onValueChange('dept-1')}
                >
                    Select Departamento
                </button>
            ) : (
                <>
                    <button
                        data-testid="select-docente"
                        onClick={() => onValueChange('professor')}
                        type="button"
                    >
                        Select Docente
                    </button>
                    <button
                        data-testid="select-jefe"
                        onClick={() => onValueChange('department_head')}
                        type="button"
                    >
                        Select Jefe
                    </button>
                </>
            )}
        </div>
    ),
    SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
    SelectValue: () => <span>Select Value</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children }: any) => <div>{children}</div>,
}));

describe('Register Component', () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            login: mockLogin,
            user: null
        });
    });

    const renderRegister = () => {
        return render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );
    };

    it('renders registration form correctly', () => {
        renderRegister();

        expect(screen.getAllByText('Crear Cuenta')[0]).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
        expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirmar Contraseña/i)).toBeInTheDocument();
        expect(screen.getByText('Departamento')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeInTheDocument();
    });

    it('validates password mismatch and shows error', async () => {
        renderRegister();

        await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
        await userEvent.type(screen.getByLabelText('Correo Electrónico'), 'juan@u.icesi.edu.co');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'password123');
        await userEvent.type(screen.getByLabelText(/Confirmar Contraseña/i), 'password456');

        await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
        expect(authAPI.register).not.toHaveBeenCalled();
    });

    it('requires department before submit', async () => {
        renderRegister();

        await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
        await userEvent.type(screen.getByLabelText('Correo Electrónico'), 'juan@u.icesi.edu.co');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'password12345');
        await userEvent.type(screen.getByLabelText(/Confirmar Contraseña/i), 'password12345');

        await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        expect(screen.getByText(/Debe seleccionarse un departamento/i)).toBeInTheDocument();
        expect(authAPI.register).not.toHaveBeenCalled();
    });

    it('shows message when login fails after successful register', async () => {
        (authAPI.register as any).mockResolvedValue(undefined);
        mockLogin.mockResolvedValue(null);

        renderRegister();

        await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
        await userEvent.type(screen.getByLabelText('Correo Electrónico'), 'juan@example.com');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'password12345');
        await userEvent.type(screen.getByLabelText(/Confirmar Contraseña/i), 'password12345');
        await userEvent.click(screen.getByTestId('select-jefe'));
        await userEvent.click(screen.getByTestId('select-dept'));
        await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        await waitFor(() => {
            expect(screen.getByText(/Registro exitoso, por favor inicia sesión/i)).toBeInTheDocument();
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('validates short password and shows error', async () => {
        renderRegister();

        await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
        await userEvent.type(screen.getByLabelText('Correo Electrónico'), 'juan@u.icesi.edu.co');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'pass');
        await userEvent.type(screen.getByLabelText(/Confirmar Contraseña/i), 'pass');

        await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        expect(screen.getByText(/La contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
        expect(authAPI.register).not.toHaveBeenCalled();
    });

    it('submits form successfully and calls authAPI.register then logs in', async () => {
        (authAPI.register as any).mockResolvedValue(undefined);
        mockLogin.mockResolvedValue({
            id: 'new-1',
            idNumber: 'new-1',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            role: 'department_head',
            department: 'Departamento de Ingeniería',
        });

        renderRegister();

        await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
        await userEvent.type(screen.getByLabelText('Correo Electrónico'), 'juan@example.com');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'password12345');
        await userEvent.type(screen.getByLabelText(/Confirmar Contraseña/i), 'password12345');

        await userEvent.click(screen.getByTestId('select-jefe'));
        await userEvent.click(screen.getByTestId('select-dept'));

        await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        expect(authAPI.register).toHaveBeenCalledWith({
            email: 'juan@example.com',
            password: 'password12345',
            name: 'Juan Pérez',
            roleNames: ['JEFE_DEPARTAMENTO'],
            departmentId: 'dept-1',
        });

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('juan@example.com', 'password12345');
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('¡Registro exitoso!'));
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('displays API error during registration', async () => {
        (authAPI.register as any).mockRejectedValue(new Error('User already exists'));

        renderRegister();

        await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
        await userEvent.type(screen.getByLabelText('Correo Electrónico'), 'existente@example.com');
        await userEvent.type(screen.getByLabelText('Contraseña'), 'password12345');
        await userEvent.type(screen.getByLabelText(/Confirmar Contraseña/i), 'password12345');
        await userEvent.click(screen.getByTestId('select-dept'));

        await userEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        await waitFor(() => {
            expect(screen.getByText(/User already exists/i)).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('User already exists');
        });

        expect(mockLogin).not.toHaveBeenCalled();
    });
});
