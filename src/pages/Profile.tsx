import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supportRequestsAPI, favoriteListsAPI, usersAPI } from '../services/api';
import { EXPERIENCE_LEVEL_TO_BACKEND, getExperienceLevelLabel } from '../utils/profileSetup';
import { getChatSessionCount } from '../utils/chatStats';
import { getDaysOnPlatform } from '../utils/accountTenure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Mail, Building, GraduationCap, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useWalkthroughOptional } from '../tour/WalkthroughProvider';

interface PasswordInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
}

function PasswordInputField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  visible,
  onToggleVisible,
}: PasswordInputFieldProps) {
  const toggleLabel = visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex w-full items-center rounded-md border border-input bg-input-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 min-w-0 flex-1 border-0 bg-transparent pl-3 pr-0 shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          className="flex h-9 shrink-0 items-center justify-center pl-2 pr-3 text-muted-foreground hover:text-foreground"
          onClick={onToggleVisible}
          aria-label={toggleLabel}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const walkthrough = useWalkthroughOptional();
  const [daysOnPlatform, setDaysOnPlatform] = useState<number | null>(() =>
    getDaysOnPlatform(user?.createdAt),
  );
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'beginner');
  const [academicArea, setAcademicArea] = useState(user?.academicArea || '');
  const [savedResourcesCount, setSavedResourcesCount] = useState(0);
  const [supportRequestsCount, setSupportRequestsCount] = useState(0);
  const [chatSessionsCount, setChatSessionsCount] = useState(0);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
    setAcademicArea(user.academicArea || '');
  }, [user?.experienceLevel, user?.academicArea]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        const [lists, requests, sessions] = await Promise.all([
          favoriteListsAPI.getAll(),
          supportRequestsAPI.getMyRequests(user.id),
          getChatSessionCount(),
        ]);

        const resources = lists.reduce((acc, list) => acc + (list.resourceCount || 0), 0);
        setSavedResourcesCount(resources);
        setSupportRequestsCount(requests.length);
        setChatSessionsCount(sessions);

        try {
          const profile = await usersAPI.getMe();
          const createdAt = profile.createdAt ?? user.createdAt;
          const days = getDaysOnPlatform(createdAt);
          setDaysOnPlatform(days);
          if (createdAt && createdAt !== user.createdAt) {
            updateProfile({ createdAt });
          }
        } catch (profileError) {
          console.error('Error fetching profile for tenure:', profileError);
          const days = getDaysOnPlatform(user.createdAt);
          if (days != null) setDaysOnPlatform(days);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user?.id, user?.createdAt, updateProfile]);

  const handleSavePreferences = async () => {
    if (user?.role !== 'professor') return;

    const area = academicArea.trim();
    if (!area) {
      toast.error('Ingresa tu área académica primaria.');
      return;
    }

    setSavingPreferences(true);
    try {
      const updated = await usersAPI.updateMyProfilePreferences({
        levelExperienceAIG: EXPERIENCE_LEVEL_TO_BACKEND[experienceLevel] ?? experienceLevel,
        academicArea: area,
      });
      updateProfile(updated);
      toast.success('¡Preferencias guardadas en tu cuenta!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('No se pudieron guardar las preferencias. Intenta de nuevo.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('Ingresa tu contraseña actual.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setChangingPassword(true);
    try {
      await usersAPI.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Contraseña actualizada correctamente.');
      resetPasswordForm();
      setIsPasswordDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.';
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1>Perfil y Preferencias</h1>
        <p className="text-muted-foreground mt-1">
          Maneja la configuración de tu cuenta y personaliza tu experiencia
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información del perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {user?.name && getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 data-testid="profile-name">{user?.name}</h3>
                <button
                data-testid="edit-profile-link"
                onClick={() => navigate('/edit-profile')}
                style={{padding: '4px 8px', fontSize: '12px', cursor: 'pointer'}}>Editar</button>
                <Badge variant="secondary" className="mt-2">
                  {user?.role === 'professor' ? 'Miembro de la facultad' : 'Jefe de departamento'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  data-tour="profile-tutorial-button"
                  onClick={() => {
                    walkthrough?.reset();
                    walkthrough?.start();
                  }}
                >
                  Ver tutorial
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Correo electrónico</p>
                  <p className="text-sm truncate" data-testid="profile-email">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Departamento</p>
                  <p className="text-sm" data-testid="profile-department">{user?.department}</p>
                </div>
              </div>

              {user?.role === 'professor' && user?.academicArea && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Área académica</p>
                    <p className="text-sm">{user.academicArea}</p>
                  </div>
                </div>
              )}

              {user?.role === 'professor' && user?.experienceLevel && (
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Nivel de Experiencia de IA</p>
                    <p className="text-sm">{getExperienceLevelLabel(user.experienceLevel)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          {user?.role === 'professor' && (
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Experiencia con IA</CardTitle>
                <CardDescription>
                  Ayúdanos a personalizar tu experiencia compartiendo tu nivel de familiaridad con IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Nivel de Experiencia con Herramientas de IA</Label>
                  <Select
                    value={experienceLevel}
                    onValueChange={(value) => setExperienceLevel(value as 'beginner' | 'intermediate' | 'advanced')}
                  >
                    <SelectTrigger id="experience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        Principiante - Nuevo en IA para educación
                      </SelectItem>
                      <SelectItem value="intermediate">
                        Intermedio - Algo de experiencia con herramientas de IA
                      </SelectItem>
                      <SelectItem value="advanced">
                        Avanzado - Uso regular de la IA en la enseñanza
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Esto nos ayuda a recomendar recursos apropiados y adaptar las respuestas del chatbot.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área Académica Primaria</Label>
                  <Input
                    id="area"
                    value={academicArea}
                    onChange={(e) => setAcademicArea(e.target.value)}
                    placeholder="Ej.: Ingeniería de software, Matemáticas aplicadas"
                  />
                  <p className="text-xs text-muted-foreground">
                    Priorizaremos los recursos relevantes para tu disciplina.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Configuración de notificaciones</CardTitle>
              <CardDescription>Gestiona cómo recibes actualizaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Notificaciones por correo</p>
                  <p className="text-xs text-muted-foreground">Recibir actualizaciones por correo electrónico de las respuestas</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Nuevas alertas de recursos</p>
                  <p className="text-xs text-muted-foreground">Recibe notificaciones sobre nuevos contenidos de la biblioteca</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <Separator />
              {/*<div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Resumen semanal</p>
                  <p className="text-xs text-muted-foreground">Resumen de la actividad de la plataforma</p>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>*/}
            </CardContent>
          </Card>

          {user?.role === 'professor' && (
            <Button
              onClick={() => void handleSavePreferences()}
              className="w-full"
              disabled={savingPreferences}
            >
              {savingPreferences ? 'Guardando...' : 'Guardar preferencias'}
            </Button>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la cuenta</CardTitle>
              <CardDescription>Administra la configuración de seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPasswordDialogOpen(true)}
                data-testid="change-password-btn"
              >
                Cambiar la contraseña
              </Button>
            </CardContent>
          </Card>

          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={(open) => {
              setIsPasswordDialogOpen(open);
              if (!open) resetPasswordForm();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa tu contraseña actual y elige una nueva (mínimo 8 caracteres).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <PasswordInputField
                  id="current-password"
                  label="Contraseña actual"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                  visible={showCurrentPassword}
                  onToggleVisible={() => setShowCurrentPassword((v) => !v)}
                />
                <PasswordInputField
                  id="new-password"
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                  visible={showNewPassword}
                  onToggleVisible={() => setShowNewPassword((v) => !v)}
                />
                <PasswordInputField
                  id="confirm-new-password"
                  label="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  visible={showConfirmPassword}
                  onToggleVisible={() => setShowConfirmPassword((v) => !v)}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-[#5454e9] hover:bg-[#4040d0]"
                    onClick={() => void handleChangePassword()}
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Guardando...' : 'Guardar contraseña'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                    disabled={changingPassword}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {user?.role === 'professor' && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de uso</CardTitle>
                <CardDescription>Tu actividad en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-2xl">{chatSessionsCount}</p>
                    <p className="text-xs text-muted-foreground">Sesiones de chat</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-2xl">{savedResourcesCount}</p>
                    <p className="text-xs text-muted-foreground">Recursos guardados</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-2xl">{supportRequestsCount}</p>
                    <p className="text-xs text-muted-foreground">Solicitudes de apoyo</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-2xl">{daysOnPlatform ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Días en la plataforma</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
