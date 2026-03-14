import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserService from '../../services/UserService';

const isAdminUser = (user) => String(user?.id_rol) === '1' || user?.nombre_rol === 'Administrador';
const REMEMBER_ID_COOKIE = 'rememberedUserId';
const USER_ID_HISTORY_COOKIE = 'loginUserIdHistory';

const readCookie = (name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
};

const setCookie = (name, value, days) => {
  const maxAge = Math.max(1, Number(days || 1)) * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

const readIdHistory = () => {
  try {
    const raw = readCookie(USER_ID_HISTORY_COOKIE);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 8);
  } catch {
    return [];
  }
};

const saveIdHistory = (idUsuario) => {
  const normalizedId = String(idUsuario || '').trim();
  if (!normalizedId) {
    return;
  }

  const history = readIdHistory();
  const nextHistory = [normalizedId, ...history.filter((item) => item !== normalizedId)].slice(0, 8);
  setCookie(USER_ID_HISTORY_COOKIE, JSON.stringify(nextHistory), 30);
};

export function LoginUsuario() {
  const logoBlue = '#63859E';
  const logoCandidates = [
    '/bolur-logo-horizontal.png',
    '/bolur-logo-horizontal.jpg',
    '/bolur-logo-horizontal.jpeg',
    '/bolur-logo-horizontal.webp',
    '/bolur-logo-horizontal.svg',
    '/logo-bolur-horizontal.png',
    '/logo-bolur.png',
    '/bolur-logo.png',
  ];
  const navigate = useNavigate();
  const [idUsuario, setIdUsuario] = useState('');
  const [idSuggestions, setIdSuggestions] = useState([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogoImage, setShowLogoImage] = useState(true);
  const [logoIndex, setLogoIndex] = useState(0);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    const rememberedId = readCookie(REMEMBER_ID_COOKIE);
    if (rememberedId) {
      setIdUsuario(rememberedId);
    }

    setIdSuggestions(readIdHistory());
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
    // Evita el refresco del formulario para procesar el login desde React.
    event.preventDefault();

    // Verifica que el usuario haya completado ambos campos antes de enviar.
    if (idUsuario.trim() === '' || password.trim() === '') {
      openErrorDialog('Datos incompletos', 'Ingrese su ID de usuario y contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Envía las credenciales al servicio que consume el endpoint de autenticación.
      const response = await UserService.login({
        id_usuario: idUsuario.trim(),
        password,
      });

      const authUser = response?.data?.user;
      const token = response?.data?.token;

      // Si el backend no devolvió usuario o token, se considera un acceso inválido.
      if (!authUser || !token) {
        openErrorDialog('Error de acceso', 'No fue posible iniciar sesión. Intente nuevamente.');
        return;
      }

      // Persiste la sesión en el navegador para reutilizarla entre pantallas.
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('authToken', token);

      const normalizedId = idUsuario.trim();
      setCookie(REMEMBER_ID_COOKIE, normalizedId, 30);
      saveIdHistory(normalizedId);
      setIdSuggestions(readIdHistory());

      toast.success(`Inicio de sesión correcto para ${authUser.nombre}.`);

      // Redirige según el rol del usuario autenticado.
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
          borderBottom: { xs: `220px solid ${logoBlue}`, md: `320px solid ${logoBlue}` },
          borderLeft: { xs: '220px solid transparent', md: '320px solid transparent' },
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Stack
        spacing={4}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 520,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 460,
            mx: 'auto',
          }}
        >
          {showLogoImage ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                px: 0.5,
                borderRadius: 1,
                backgroundColor: '#f4f5f7',
              }}
            >
              <Box
                component="img"
                src={logoCandidates[logoIndex]}
                alt="Bolur Engineers"
                onError={() => {
                  if (logoIndex < logoCandidates.length - 1) {
                    setLogoIndex((prev) => prev + 1);
                    return;
                  }

                  setShowLogoImage(false);
                }}
                sx={{
                  width: '100%',
                  maxWidth: { xs: 330, md: 440 },
                  height: 'auto',
                  mx: 'auto',
                  display: 'block',
                  mixBlendMode: 'multiply',
                }}
              />
            </Box>
          ) : (
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: { xs: '0.08em', md: '0.18em' },
                fontSize: { xs: '1.9rem', md: '2.5rem' },
                color: logoBlue,
              }}
            >
              {'B\u00f6lur Engineers S.A.'}
            </Typography>
          )}
          <Typography
            variant="h6"
            sx={{
              mt: 1.8,
              color: logoBlue,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', md: '1rem' },
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              textAlign: 'center',
              width: '100%',
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            Control de Horas y Proyectos
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
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
              <Autocomplete
                freeSolo
                forcePopupIcon={false}
                openOnFocus={false}
                options={idSuggestions}
                inputValue={idUsuario}
                onInputChange={(_, newValue) => setIdUsuario(String(newValue || '').replace(/\D/g, ''))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ID Usuario"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      ...params.inputProps,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 20,
                      spellCheck: false,
                      autoCorrect: 'off',
                      autoCapitalize: 'none',
                    }}
                    autoComplete="username"
                    sx={{
                      '& .MuiAutocomplete-endAdornment': { display: 'none' },
                    }}
                  />
                )}
              />

              <TextField
                label="Contrasena"
                name="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
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

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderRadius: 1.5,
                  textTransform: 'uppercase',
                  backgroundColor: logoBlue,
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#4E6F87',
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
          <Button
            variant="contained"
            onClick={closeErrorDialog}
            autoFocus
            sx={{
              backgroundColor: logoBlue,
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#4E6F87',
              },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
