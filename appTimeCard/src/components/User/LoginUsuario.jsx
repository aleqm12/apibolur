import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserService from '../../services/UserService';

const isAdminUser = (user) => String(user?.id_rol) === '1' || user?.nombre_rol === 'Administrador';

export function LoginUsuario() {
  const navigate = useNavigate();
  const [idUsuario, setIdUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (idUsuario.trim() === '' || password.trim() === '') {
      toast.error('Ingrese su ID de usuario y contrasena.');
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
        toast.error('No fue posible iniciar sesion.');
        return;
      }

      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('authToken', token);

      toast.success(`Bienvenido, ${authUser.nombre}.`);

      if (isAdminUser(authUser)) {
        navigate('/admin/panel');
      } else {
        navigate('/');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Credenciales invalidas';
      toast.error(message);
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
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '0.18em', color: 'secondary.main' }}>
            Bolur Engineers S.A.
          </Typography>
          <Typography variant="h6" sx={{ mt: 1.5, letterSpacing: '0.14em', color: 'secondary.main' }}>
            Gestion de Horas - Lineas de Transmision
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
                onChange={(event) => setIdUsuario(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />

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

              <Button type="submit" variant="contained" color="secondary" disabled={isSubmitting} sx={{ py: 1.2, fontWeight: 700, letterSpacing: '0.05em' }}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Box>
  );
}
