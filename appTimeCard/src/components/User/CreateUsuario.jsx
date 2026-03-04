import { useMemo, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useForm, Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UserService from '../../services/UserService';

export function CreateUsuario() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const defaultValues = {
    id_usuario: '',
    nombre: '',
    id_rol: '',
    nivel: '',
    password: '',
  };

  const userSchema = yup.object({
    id_usuario: yup
      .string()
      .required('El ID del usuario es requerido')
      .max(20, 'El ID del usuario debe tener máximo 20 caracteres'),
    nombre: yup
      .string()
      .required('El nombre es requerido')
      .max(150, 'El nombre debe tener máximo 150 caracteres'),
    id_rol: yup
      .string()
      .required('El ID del rol es requerido')
      .max(20, 'El ID del rol debe tener máximo 20 caracteres'),
    nivel: yup
      .string()
      .required('El nivel es requerido')
      .max(50, 'El nivel debe tener máximo 50 caracteres'),
    password: yup
      .string()
      .required('La contraseña es requerida')
      .max(255, 'La contraseña debe tener máximo 255 caracteres'),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(userSchema),
  });

  const onError = (formErrors, event) => console.log(formErrors, event);

  const onSubmit = async (dataForm) => {
    try {
      const payloadUser = {
        id_usuario: dataForm.id_usuario,
        nombre: dataForm.nombre,
        id_rol: dataForm.id_rol,
        nivel: dataForm.nivel,
        password: dataForm.password,
      };

      const response = await UserService.createUser(payloadUser);
      setError(response.error);

      toast.success(`Usuario creado #${dataForm.id_usuario} - ${dataForm.nombre}`, {
        duration: 4000,
        position: 'top-center',
      });

      setUsers((prevUsers) => [payloadUser, ...prevUsers]);
      reset(defaultValues);
      setShowPassword(false);
      setIsFormOpen(false);
    } catch (submitError) {
      if (submitError instanceof SyntaxError) {
        console.log(submitError);
        setError(submitError);
        throw new Error('Respuesta no válida del servidor');
      }
      setError(submitError);
      toast.error('No se pudo crear el usuario');
      console.error(submitError);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((userItem) => {
      return (
        userFilter.trim() === '' ||
        userItem.id_usuario.toLowerCase().includes(userFilter.trim().toLowerCase()) ||
        userItem.nombre.toLowerCase().includes(userFilter.trim().toLowerCase())
      );
    });
  }, [users, userFilter]);

  if (error && error.message) return <p>Error: {error.message}</p>;

  return (
    <>
      <form id="create-usuario-form" onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        <Grid container spacing={1}>
          <Grid
            size={12}
            sx={{
              mb: 2,
              px: { xs: 2, md: 4 },
              py: 2,
              backgroundColor: 'secondary.main',
              color: 'secondary.contrastText',
            }}
          >
            <Grid container alignItems="center" spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  BÖLUR ENGINEERS
                </Typography>
                <Typography variant="body2" sx={{ color: 'secondary.contrastText' }}>
                  Usuario: Alejandro Quesada Molina
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.contrastText' }}>
                  Panel de Administración
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'secondary.contrastText' }}>
                  Creación de Usuarios
                </Typography>
              </Grid>

              <Grid
                size={{ xs: 12, md: 3 }}
                sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/panel')}
                  sx={{
                    color: 'secondary.contrastText',
                    borderColor: 'secondary.contrastText',
                    '&:hover': {
                      borderColor: 'secondary.contrastText',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  Volver al Panel
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={12}>
            <Typography variant="h5" gutterBottom sx={{ px: { xs: 2, md: 3 } }}>
              Gestión de Usuarios
            </Typography>
          </Grid>

          <Grid size={12} sx={{ px: { xs: 2, md: 3 }, mb: 1 }}>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={() => {
                setIsFormOpen((prev) => !prev);
                if (isFormOpen) {
                  reset(defaultValues);
                  setShowPassword(false);
                }
              }}
            >
              {isFormOpen ? 'Ocultar Formulario' : '+ Nuevo Usuario'}
            </Button>
          </Grid>

          <Grid size={12} sx={{ px: { xs: 2, md: 3 }, mb: 1 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
              <TextField
                fullWidth
                label="Buscar Usuario (ID o Nombre)"
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
              />
            </Paper>
          </Grid>

          <Grid size={12} sx={{ px: { xs: 2, md: 3 }, mb: 2 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Usuario</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>ID Rol</TableCell>
                      <TableCell>Nivel</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Aún no hay usuarios creados en esta sesión.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id_usuario} hover>
                          <TableCell>{userItem.id_usuario}</TableCell>
                          <TableCell>{userItem.nombre}</TableCell>
                          <TableCell>{userItem.id_rol}</TableCell>
                          <TableCell>{userItem.nivel}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Dialog
            open={isFormOpen}
            onClose={() => {
              reset(defaultValues);
              setShowPassword(false);
              setIsFormOpen(false);
            }}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>Formulario de Nuevo Usuario</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={1} sx={{ pt: 1 }}>
                <Grid size={12} sm={6}>
                  <Controller
                    name="id_usuario"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        id="id_usuario"
                        label="ID Usuario"
                        error={Boolean(errors.id_usuario)}
                        helperText={errors.id_usuario ? errors.id_usuario.message : ' '}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="nombre"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        id="nombre"
                        label="Nombre"
                        error={Boolean(errors.nombre)}
                        helperText={errors.nombre ? errors.nombre.message : ' '}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="id_rol"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        id="id_rol"
                        label="ID Rol"
                        error={Boolean(errors.id_rol)}
                        helperText={errors.id_rol ? errors.id_rol.message : ' '}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="nivel"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        id="nivel"
                        label="Nivel"
                        error={Boolean(errors.nivel)}
                        helperText={errors.nivel ? errors.nivel.message : ' '}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        id="password"
                        label="Contraseña"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="Mostrar u ocultar contraseña"
                                onClick={() => setShowPassword((prev) => !prev)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        error={Boolean(errors.password)}
                        helperText={errors.password ? errors.password.message : ' '}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  reset(defaultValues);
                  setShowPassword(false);
                  setIsFormOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="contained"
                color="primary"
                form="create-usuario-form"
                onClick={handleSubmit(onSubmit, onError)}
              >
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </form>
    </>
  );
}
