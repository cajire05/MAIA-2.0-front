import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import imgLogo from "figma:asset/logo-completo.png";
import { isProfileSetupComplete } from '../utils/profileSetup';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        navigate(isProfileSetupComplete(loggedInUser) ? '/dashboard' : '/profile');
      } else {
        setError('Correo o contraseña inválidos. Por favor intenta de nuevo.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f7fb] to-white p-4">
      <Card className="w-full max-w-md border-2 border-[#f5f7fb]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img 
              src={imgLogo} 
              alt="Universidad ICESI" 
              className="h-20 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">MAIA</CardTitle>
          <CardDescription>
            Ingresa con tus credenciales institucionales para acceder a recursos de enseñanza potenciados por IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                data-testid="login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-[#f5f7fb]"
                required
                data-testid="login-password"
              />
            </div>

            {error && (
              <Alert variant="destructive" data-testid="login-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-[#5454e9] hover:bg-[#4040d0]"
              disabled={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link 
                to="/register" 
                className="text-[#5454e9] hover:text-[#4040d0] font-medium underline"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
