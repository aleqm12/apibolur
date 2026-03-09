import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserService from '../../services/UserService';

const isAdminUser = (user) => String(user?.id_rol) === '1' || user?.nombre_rol === 'Administrador';
const REMEMBER_ID_COOKIE = 'rememberedUserId';

const readCookie = (name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
};

const setCookie = (name, value, days) => {
  const maxAge = Math.max(1, Number(days || 1)) * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

export function LoginUsuario() {
  const navigate = useNavigate();
  const [idUsuario, setIdUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [knownUserIds, setKnownUserIds] = useState([]);
  const [rememberUserId, setRememberUserId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    const rememberedId = readCookie(REMEMBER_ID_COOKIE);
    if (rememberedId) {
      setIdUsuario(rememberedId);
      setRememberUserId(true);
    }

    UserService.getUsers()
      .then((response) => {
        const users = Array.isArray(response?.data) ? response.data : [];
        const uniqueIds = [...new Set(users.map((userItem) => String(userItem?.id_usuario || '').trim()).filter(Boolean))];
        setKnownUserIds(uniqueIds);
      })
      .catch(() => {
        setKnownUserIds([]);
      });
  }, []);

  const openErrorDialog = (title, message) => {
    setErrorDialog({
      open: true,
      title,
      message,
    });
  };

  const closeErrorDialog = () => {
    setErrorDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (idUsuario.trim() === '' || password.trim() === '') {
      openErrorDialog('Datos incompletos', 'Ingrese su ID de usuario y contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await UserService.login({
        id_usuario: idUsuario.trim(),
        password,
      });

      const authUser = response?.data?.user;
      const token = response?.data?.token;

      if (!authUser || !token) {
        openErrorDialog('Error de acceso', 'No fue posible iniciar sesión. Intente nuevamente.');
        return;
      }

      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('authToken', token);

      if (rememberUserId) {
        setCookie(REMEMBER_ID_COOKIE, idUsuario.trim(), 30);
      } else {
        deleteCookie(REMEMBER_ID_COOKIE);
      }

      toast.success(`Inicio de sesión correcto para ${authUser.nombre}.`);

      if (isAdminUser(authUser)) {
        navigate('/admin/panel');
      } else {
        navigate('/');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Credenciales inválidas';
      openErrorDialog('Error de acceso', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 6rem)',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#f4f5f7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          borderTop: { xs: '220px solid #7A1E3A', md: '320px solid #7A1E3A' },
          borderRight: { xs: '220px solid transparent', md: '320px solid transparent' },
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderBottom: { xs: '220px solid #102A43', md: '320px solid #102A43' },
          borderLeft: { xs: '220px solid transparent', md: '320px solid transparent' },
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Stack spacing={4} sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>
        <Box textAlign="center">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: { xs: '0.08em', md: '0.18em' },
              fontSize: { xs: '1.9rem', md: '2.5rem' },
              color: 'secondary.main',
            }}
          >
            {'B\u00f6lur Engineers S.A.'}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2.6, letterSpacing: '0.14em', color: 'secondary.main' }}>
            Gestión de Horas - Líneas de Transmisión
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.2}>
              <TextField
                label="ID Usuario"
                value={idUsuario}
                onChange={(event) => setIdUsuario(event.target.value.replace(/\D/g, ''))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  list: 'known-user-ids',
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 20,
                  spellCheck: false,
                  autoCorrect: 'off',
                  autoCapitalize: 'none',
                }}
                autoComplete="off"
                fullWidth
              />

              <datalist id="known-user-ids">
                {knownUserIds.map((userId) => (
                  <option key={userId} value={userId} />
                ))}
              </datalist>

              <TextField
                label="Contrasena"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" aria-label="Mostrar u ocultar contrasena">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />

              <FormControlLabel
                control={<Checkbox checked={rememberUserId} onChange={(event) => setRememberUserId(event.target.checked)} color="secondary" />}
                label="Recordar mi ID de usuario"
              />

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={isSubmitting}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderRadius: 1.5,
                  textTransform: 'uppercase',
                  '&:hover': {
                    backgroundColor: '#1f4b74',
                  },
                }}
              >
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>

      <Dialog open={errorDialog.open} onClose={closeErrorDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={closeErrorDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
