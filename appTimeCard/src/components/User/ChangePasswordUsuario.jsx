import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserService from '../../services/UserService';

const getPasswordValidationMessage = (passwordValue) => {
  if (passwordValue.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }
  if (!/[a-z]/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }
  if (!/\d/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos un número.';
  }
  if (!/[^A-Za-z0-9]/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos un signo especial.';
  }

  return '';
};

export function ChangePasswordUsuario() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

  const authUser = useMemo(() => {
    try {
      const rawAuthUser = localStorage.getItem('authUser');
      return rawAuthUser ? JSON.parse(rawAuthUser) : null;
    } catch {
      return null;
    }
  }, []);

  const handleError = (title, message) => {
    setErrorDialog({ open: true, title, message });
  };

  const closeErrorDialog = () => {
    setErrorDialog({ open: false, title: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!authUser?.id_usuario) {
      handleError('Sesión inválida', 'No se encontró información del usuario autenticado.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      handleError('Datos incompletos', 'Complete los tres campos de contraseña.');
      return;
    }

    const passwordValidationMessage = getPasswordValidationMessage(newPassword);
    if (passwordValidationMessage) {
      handleError('Contraseña inválida', passwordValidationMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      handleError('Contraseñas distintas', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPassword === currentPassword) {
      handleError('Sin cambios', 'La nueva contraseña debe ser distinta a la actual.');
      return;
    }

    try {
      setIsSubmitting(true);
      await UserService.changePassword({
        id_usuario: authUser.id_usuario,
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/');
    } catch (serviceError) {
      const backendMessage = serviceError?.response?.data?.message || 'No fue posible cambiar la contraseña.';
      handleError('No se pudo cambiar la contraseña', backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 10rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 460, p: { xs: 3, md: 4 }, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Cambiar Contraseña
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Actualice su contraseña para mantener su cuenta segura.
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Contraseña actual"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword((prev) => !prev)} edge="end" aria-label="Mostrar u ocultar contraseña actual">
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Nueva contraseña"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              helperText="Mínimo 8 caracteres, mayúscula, minúscula, número y signo especial."
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword((prev) => !prev)} edge="end" aria-label="Mostrar u ocultar nueva contraseña">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirmar nueva contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end" aria-label="Mostrar u ocultar confirmación">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="flex-end">
              <Button type="button" variant="outlined" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Dialog open={errorDialog.open} onClose={closeErrorDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{errorDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={closeErrorDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
