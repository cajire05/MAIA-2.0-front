import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { EXPERIENCE_LEVEL_TO_BACKEND } from '../utils/profileSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export function EditProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [academicArea, setAcademicArea] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setDepartment(user.department || '');
    setExperienceLevel(user.experienceLevel || 'beginner');
    setAcademicArea(user.academicArea || '');
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error('No se encontró usuario autenticado.');
      return;
    }

    if (!name.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    if (!email.trim()) {
      toast.error('El correo electrónico es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      if (user.role === 'professor') {
        const area = academicArea.trim();
        if (!area) {
          toast.error('Ingresa tu área académica.');
          setLoading(false);
          return;
        }
        const updated = await usersAPI.updateMyProfilePreferences({
          levelExperienceAIG: EXPERIENCE_LEVEL_TO_BACKEND[experienceLevel] ?? experienceLevel,
          academicArea: area,
        });
        updateProfile({
          ...updated,
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
        });
      } else {
        updateProfile({
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
        });
      }

      toast.success('Perfil actualizado exitosamente.');
      navigate('/profile');
    } catch {
      toast.error('No se pudo actualizar el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1>Editar perfil</h1>
          <p className="text-muted-foreground mt-1">Actualiza tu información personal y preferencias.</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
          <CardDescription>Estos datos se usan para personalizar tu experiencia en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre"
              data-testid="edit-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@correo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="Departamento"
            />
          </div>

          {user?.role === 'professor' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="experience">Nivel de experiencia en IA</Label>
                <Select
                  value={experienceLevel}
                  onValueChange={(value) => setExperienceLevel(value as 'beginner' | 'intermediate' | 'advanced')}
                >
                  <SelectTrigger id="experience" data-testid="edit-experience-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicArea">Área académica</Label>
                <Input
                  id="academicArea"
                  value={academicArea}
                  onChange={(event) => setAcademicArea(event.target.value)}
                  placeholder="Ej. Ingeniería de Software"
                  data-testid="edit-academic-area"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} data-testid="edit-submit">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EditProfile;

