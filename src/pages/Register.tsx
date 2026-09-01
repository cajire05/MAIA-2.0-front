import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, departmentsAPI, type Department } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import imgLogo from "figma:asset/logo-completo.png";
import { toast } from 'sonner';
import { isProfileSetupComplete } from '../utils/profileSetup';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'professor' | 'department_head'>('professor');
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [deptChoices, setDeptChoices] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    departmentsAPI
      .getAll()
      .then(setDeptChoices)
      .catch(() => {
        toast.error('Error al cargar departamentos');
        setDeptChoices([]);
      });
  }, []);

  const getRoleName = (r: 'professor' | 'department_head'): string => {
    return r === 'professor' ? 'DOCENTE' : 'JEFE_DEPARTAMENTO';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!role) {
      setError('Por favor selecciona un rol.');
      return;
    }

    if (!departmentId?.trim()) {
      setError('Debe seleccionarse un departamento');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.register({
        email,
        password,
        name,
        roleNames: [getRoleName(role)],
        departmentId,
      });

      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        toast.success('¡Registro exitoso! Bienvenido a MAIA.');
        navigate(isProfileSetupComplete(loggedInUser) ? '/dashboard' : '/profile');
      } else {
        setError('Registro exitoso, por favor inicia sesión.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al registrar. Por favor intenta de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f7fb] to-white p-4">
      <Card className="w-full max-w-md border-2 border-[#f5f7fb]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src={imgLogo} alt="Universidad ICESI" className="h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Regístrate para acceder a recursos de enseñanza potenciados por IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-[#f5f7fb]"
                required
                data-testid="register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: usuario@u.icesi.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-[#f5f7fb]"
                required
                data-testid="register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'professor' | 'department_head')}>
                <SelectTrigger className="border-2 border-[#f5f7fb]" data-testid="register-role-trigger">
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Docente</SelectItem>
                  <SelectItem value="department_head">Jefe de Departamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                data-testid="department-select"
                key={deptChoices.length > 0 ? 'depts-loaded' : 'depts-empty'}
                value={departmentId}
                onValueChange={setDepartmentId}
              >
                <SelectTrigger id="department" className="border-2 border-[#f5f7fb]" data-testid="register-department-trigger">
                  <SelectValue placeholder="Selecciona tu departamento" />
                </SelectTrigger>
                <SelectContent>
                  {deptChoices.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-[#f5f7fb]"
                required
                minLength={8}
                data-testid="register-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-2 border-[#f5f7fb]"
                required
                minLength={8}
                data-testid="register-confirm-password"
              />
            </div>

            {error && (
              <Alert variant="destructive" data-testid="register-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-[#5454e9] hover:bg-[#4040d0]"
              disabled={isLoading}
              data-testid="register-submit"
            >
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="text-[#5454e9] hover:text-[#4040d0] font-medium underline"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
