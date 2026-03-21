import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useForm, Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
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
import GrammarSuggestionService from '../../services/GrammarSuggestionService';

const getPasswordValidationMessage = (passwordValue) => {
  if (passwordValue.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/[A-Z]/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos una letra mayúscula';
  }
  if (!/[a-z]/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos una letra minúscula';
  }
  if (!/\d/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos un número';
  }
  if (!/[^A-Za-z0-9]/.test(passwordValue)) {
    return 'La contraseña debe incluir al menos un signo especial';
  }

  return null;
};

export function CreateUsuario() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    messages: [],
  });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState({
    open: false,
    userId: '',
    password: '',
    confirmPassword: '',
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState({
    nombre: '',
    apellidos: '',
  });
  const [checkingSuggestions, setCheckingSuggestions] = useState({
    nombre: false,
    apellidos: false,
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    userId: '',
    userName: '',
  });

  const fieldLabels = {
    id_usuario: 'ID de usuario',
    nombre: 'Nombre',
    apellidos: 'Apellidos',
    genero: 'Genero',
    id_rol: 'Rol',
    nivel: 'Nivel',
    password: 'Contraseña',
    passwordConfirm: 'Confirmación de contraseña',
  };

  const roleOptions = [
    { id_rol: 1, nombre_rol: 'Administrador' },
    { id_rol: 2, nombre_rol: 'Operario' },
  ];

  const nivelOptions = [
    'Gerente de Proyectos',
    'Ingeniero Senior',
    'Ingeniero III',
    'Ingeniero II',
    'Ingeniero I',
    'Pasante',
  ];

  const generoOptions = ['Masculino', 'Femenino', 'Prefiere no decir'];

  const defaultValues = {
    id_usuario: '',
    nombre: '',
    apellidos: '',
    genero: '',
    id_rol: '',
    nivel: '',
    password: '',
    passwordConfirm: '',
  };

  const userSchema = useMemo(
    () =>
      yup.object({
        id_usuario: yup
          .string()
          .required('El ID del usuario es requerido')
          .matches(/^\d+$/, 'El ID debe contener solo números, sin guiones')
          .max(20, 'El ID del usuario debe tener máximo 20 dígitos'),
        nombre: yup
          .string()
          .required('El nombre es requerido')
          .max(150, 'El nombre debe tener máximo 150 caracteres'),
        apellidos: yup
          .string()
          .required('Los apellidos son requeridos')
          .max(150, 'Los apellidos deben tener máximo 150 caracteres'),
        genero: yup
          .string()
          .required('El genero es requerido')
          .oneOf(generoOptions, 'Seleccione un genero valido'),
        id_rol: yup
          .number()
          .typeError('Seleccione un rol')
          .required('El rol es requerido'),
        nivel: yup
          .string()
          .required('El nivel es requerido')
          .max(50, 'El nivel debe tener máximo 50 caracteres'),
        password: yup
          .string()
          .max(255, 'La contraseña debe tener máximo 255 caracteres')
          .test('password-security', function validatePassword(value) {
            const normalizedPassword = (value || '').trim();

            if (!isEditMode && normalizedPassword === '') {
              return this.createError({ message: 'La contraseña es requerida' });
            }

            if (normalizedPassword === '') {
              return true;
            }

            const passwordMessage = getPasswordValidationMessage(normalizedPassword);
            if (passwordMessage) {
              return this.createError({ message: passwordMessage });
            }

            return true;
          }),
        passwordConfirm: yup
          .string()
          .max(255, 'La confirmación de contraseña debe tener máximo 255 caracteres')
          .test('password-match', function validatePasswordConfirmation(value) {
            const normalizedPassword = (this.parent.password || '').trim();
            const normalizedPasswordConfirm = (value || '').trim();

            if (!isEditMode && normalizedPasswordConfirm === '') {
              return this.createError({ message: 'La confirmación de contraseña es requerida' });
            }

            if (isEditMode && normalizedPassword === '') {
              return true;
            }

            if (isEditMode && normalizedPassword !== '' && normalizedPasswordConfirm === '') {
              return this.createError({ message: 'Confirme la nueva contraseña' });
            }

            if (normalizedPasswordConfirm !== normalizedPassword) {
              return this.createError({ message: 'Las contraseñas no coinciden' });
            }

            return true;
          }),
      }),
    [isEditMode]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(userSchema),
  });

  const onError = (formErrors, event) => {
    console.log(formErrors, event);
    const missingFields = Object.entries(formErrors)
      .filter(([, value]) => value?.type === 'required')
      .map(([key]) => fieldLabels[key] || key);

    if (missingFields.length > 0) {
      setErrorDialog({
        open: true,
        title: 'Faltan campos obligatorios',
        messages: missingFields.map((fieldName) => `Complete el campo: ${fieldName}`),
      });
      return;
    }

    const firstErrorMessage = Object.values(formErrors)[0]?.message;
    if (firstErrorMessage) {
      setErrorDialog({
        open: true,
        title: 'Revise el formulario',
        messages: [firstErrorMessage],
      });
    }
  };

  const onSubmit = async (dataForm) => {
    try {
      // Evita duplicidad de cédula/ID antes de registrar o actualizar.
      const normalizedId = (dataForm.id_usuario || '').trim();
      const normalizedEditingId = (editingUserId || '').trim();
      const duplicatedUser = users.find((userItem) => {
        const currentId = (userItem.id_usuario || '').trim();
        if (isEditMode && currentId === normalizedEditingId) {
          return false;
        }
        return currentId === normalizedId;
      });

      if (duplicatedUser) {
        setErrorDialog({
          open: true,
          title: isEditMode ? 'No se puede modificar el usuario' : 'No se puede crear el usuario',
          messages: [`El ID ${dataForm.id_usuario} ya existe. Ingrese una cédula distinta.`],
        });
        return;
      }

      const payloadUser = {
        id_usuario: dataForm.id_usuario,
        nombre: dataForm.nombre,
        apellidos: dataForm.apellidos,
        genero: dataForm.genero,
        id_rol: dataForm.id_rol,
        nivel: dataForm.nivel,
      };
      const passwordValue = (dataForm.password || '').trim();
      const passwordWasUpdated = isEditMode && passwordValue !== '';

      let response;
      if (isEditMode) {
        // Flujo de modificación del colaborador seleccionado.
        response = await UserService.updateUser(
          passwordValue
            ? {
                ...payloadUser,
                password: dataForm.password,
              }
            : payloadUser
        );
      } else {
        // Flujo de registro de un nuevo colaborador.
        response = await UserService.createUser({
          ...payloadUser,
          password: dataForm.password,
        });
      }
      setError(response.error);

      const userSaved = response.data ?? { ...payloadUser, nombre_rol: roleOptions.find((r) => r.id_rol === Number(payloadUser.id_rol))?.nombre_rol };

      if (isEditMode) {
        setSuccessDialog({
          open: true,
          title: 'Usuario editado con éxito',
          message: `Se modificó correctamente el usuario #${dataForm.id_usuario} - ${dataForm.nombre}. ${passwordWasUpdated ? 'La contraseña fue actualizada.' : 'La contraseña no se modificó.'}`,
        });
      } else {
        setSuccessDialog({
          open: true,
          title: 'Usuario guardado con éxito',
          message: `Se guardó correctamente el usuario #${dataForm.id_usuario} - ${dataForm.nombre}.`,
        });
      }

      if (isEditMode) {
        setUsers((prevUsers) =>
          prevUsers.map((userItem) =>
            userItem.id_usuario === editingUserId ? userSaved : userItem
          )
        );
      } else {
        setUsers((prevUsers) => [userSaved, ...prevUsers]);
      }
      reset(defaultValues);
      setShowPassword(false);
      setIsEditMode(false);
      setEditingUserId(null);
      setIsFormOpen(false);
    } catch (submitError) {
      if (submitError instanceof SyntaxError) {
        console.log(submitError);
        setError(submitError);
        throw new Error('Respuesta no válida del servidor');
      }
      setError(submitError);
      setErrorDialog({
        open: true,
        title: isEditMode ? 'No se pudo modificar el usuario' : 'No se pudo crear el usuario',
        messages: [
          isEditMode
            ? 'Ocurrió un error al modificar el usuario.'
            : 'Ocurrió un error al crear el usuario.',
        ],
      });
      console.error(submitError);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLogoutDialogOpen(true);
  };

  const handleCloseLogoutDialog = () => {
    setLogoutDialogOpen(false);
    navigate('/');
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({
      open: false,
      title: '',
      messages: [],
    });
  };

  const filteredUsers = useMemo(() => {
    // Aplica búsqueda por ID, nombre o apellidos para consulta rápida.
    return users.filter((userItem) => {
      return (
        userFilter.trim() === '' ||
        userItem.id_usuario.toLowerCase().includes(userFilter.trim().toLowerCase()) ||
        userItem.nombre.toLowerCase().includes(userFilter.trim().toLowerCase()) ||
        (userItem.apellidos || '').toLowerCase().includes(userFilter.trim().toLowerCase())
      );
    });
  }, [users, userFilter]);

  const handleEditUser = (userItem) => {
    // Carga datos del colaborador en el formulario para edición.
    setIsEditMode(true);
    setEditingUserId(userItem.id_usuario);
    reset({
      id_usuario: userItem.id_usuario,
      nombre: userItem.nombre,
      apellidos: userItem.apellidos || '',
      genero: userItem.genero || '',
      id_rol: Number(userItem.id_rol),
      nivel: userItem.nivel,
      password: '',
      passwordConfirm: '',
    });
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (usuario) => {
    setDeleteConfirmDialog({
      open: true,
      userId: usuario.id_usuario,
      userName: `${usuario.nombre} ${usuario.apellidos}`.trim(),
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteConfirmDialog({
      open: false,
      userId: '',
      userName: '',
    });
  };

  const handleConfirmDelete = async () => {
    const userId = deleteConfirmDialog.userId;
    try {
      await UserService.deleteUser(userId);
      setUsers((prevUsers) => prevUsers.filter((userItem) => userItem.id_usuario !== userId));
      handleCloseDeleteDialog();
      toast.success('Usuario eliminado con éxito', {
        duration: 3000,
        position: 'top-center',
      });
    } catch (serviceError) {
      console.error(serviceError);
      const errorMessage = serviceError?.response?.data?.result || 'No se pudo eliminar el usuario.';
      setErrorDialog({
        open: true,
        title: 'No se pudo eliminar el usuario',
        messages: [errorMessage],
      });
    }
  };

  const openResetPasswordDialog = (userId) => {
    setResetPasswordDialog({
      open: true,
      userId,
      password: '',
      confirmPassword: '',
    });
    setShowResetPassword(false);
  };

  const closeResetPasswordDialog = () => {
    setResetPasswordDialog({
      open: false,
      userId: '',
      password: '',
      confirmPassword: '',
    });
    setShowResetPassword(false);
  };

  const handleResetPassword = async () => {
    const newPassword = (resetPasswordDialog.password || '').trim();
    const confirmPassword = (resetPasswordDialog.confirmPassword || '').trim();

    if (!newPassword || !confirmPassword) {
      setErrorDialog({
        open: true,
        title: 'Datos incompletos',
        messages: ['Ingrese y confirme la nueva contraseña.'],
      });
      return;
    }

    const passwordValidationMessage = getPasswordValidationMessage(newPassword);
    if (passwordValidationMessage) {
      setErrorDialog({
        open: true,
        title: 'Contraseña inválida',
        messages: [passwordValidationMessage],
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorDialog({
        open: true,
        title: 'Contraseñas distintas',
        messages: ['La contraseña y su confirmación no coinciden.'],
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      const adminUser = JSON.parse(localStorage.getItem('authUser') || '{}');

      await UserService.resetPassword({
        target_user_id: resetPasswordDialog.userId,
        new_password: newPassword,
        admin_user_id: adminUser?.id_usuario || '',
      });

      toast.success(`Contraseña actualizada para ${resetPasswordDialog.userId}.`, {
        duration: 3000,
        position: 'top-center',
      });

      closeResetPasswordDialog();
    } catch (serviceError) {
      console.error(serviceError);
      setErrorDialog({
        open: true,
        title: 'No se pudo restablecer la contraseña',
        messages: [serviceError?.response?.data?.message || 'Intente nuevamente.'],
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleReviewNameField = async (fieldName, textValue) => {
    const normalizedValue = (textValue || '').trim();

    if (normalizedValue.length < 3) {
      setNameSuggestions((current) => ({
        ...current,
        [fieldName]: '',
      }));
      setCheckingSuggestions((current) => ({
        ...current,
        [fieldName]: false,
      }));
      return;
    }

    setCheckingSuggestions((current) => ({
      ...current,
      [fieldName]: true,
    }));

    const suggestions = await GrammarSuggestionService.checkText(normalizedValue, 'es');
    const firstSuggestion = suggestions.find((item) => item.replacement);

    setNameSuggestions((current) => ({
      ...current,
      [fieldName]: firstSuggestion?.replacement || '',
    }));
    setCheckingSuggestions((current) => ({
      ...current,
      [fieldName]: false,
    }));
  };

  const applyNameSuggestion = (fieldName) => {
    const suggestedValue = (nameSuggestions[fieldName] || '').trim();
    if (!suggestedValue) {
      return;
    }

    setValue(fieldName, suggestedValue, { shouldDirty: true, shouldValidate: true });
    setNameSuggestions((current) => ({
      ...current,
      [fieldName]: '',
    }));
  };

  useEffect(() => {
    // Consulta inicial de colaboradores al abrir la vista de gestión.
    UserService.getUsers()
      .then((response) => {
        const apiUsers = Array.isArray(response.data) ? response.data : [];
        setUsers(apiUsers);
      })
      .catch((serviceError) => {
        console.error(serviceError);
        setErrorDialog({
          open: true,
          title: 'Error al cargar usuarios',
          messages: ['No se pudieron cargar los usuarios existentes.'],
        });
      });
  }, []);

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
                <Typography
                  variant="body2"
                  sx={{
                    color: 'secondary.contrastText',
                    fontSize: { xs: '0.88rem', md: '0.95rem' },
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    opacity: 0.96,
                  }}
                >
                  Usuario: Alejandro Quesada Molina
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.contrastText' }}>
                  Panel de Administración
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'secondary.contrastText',
                    fontSize: { xs: '1rem', md: '1.15rem' },
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}
                >
                  Creación de Usuarios
                </Typography>
              </Grid>

              <Grid
                size={{ xs: 12, md: 3 }}
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  gap: 1,
                  flexWrap: 'wrap',
                }}
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
                  Volver al Menú
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    color: 'secondary.contrastText',
                    borderColor: 'secondary.contrastText',
                    '&:hover': {
                      borderColor: 'secondary.contrastText',
                      backgroundColor: 'secondary.contrastText',
                      color: 'secondary.main',
                    },
                  }}
                >
                  Cerrar Sesión
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
                setIsEditMode(false);
                setEditingUserId(null);
                reset(defaultValues);
                setShowPassword(false);
                setIsFormOpen(true);
              }}
            >
              + Nuevo Usuario
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
                  <TableHead sx={{ backgroundColor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID Usuario</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Apellidos</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Genero</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nivel</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Aún no hay usuarios creados en esta sesión.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id_usuario} hover>
                          <TableCell>{userItem.id_usuario}</TableCell>
                          <TableCell>{userItem.nombre}</TableCell>
                          <TableCell>{userItem.apellidos}</TableCell>
                          <TableCell>{userItem.genero || '-'}</TableCell>
                          <TableCell>{userItem.nombre_rol || roleOptions.find((role) => role.id_rol === Number(userItem.id_rol))?.nombre_rol || userItem.id_rol}</TableCell>
                          <TableCell>{userItem.nivel}</TableCell>
                          <TableCell align="center">
                            <IconButton color="primary" onClick={() => handleEditUser(userItem)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="secondary" onClick={() => openResetPasswordDialog(userItem.id_usuario)}>
                              <LockResetIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleOpenDeleteDialog(userItem)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
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
              setIsEditMode(false);
              setEditingUserId(null);
              setIsFormOpen(false);
            }}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Formulario de Nuevo Usuario'}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={1} sx={{ pt: 1 }}>
                <Grid size={12} sm={6}>
                  <Controller
                    name="id_usuario"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        onChange={(event) => {
                          const onlyDigits = event.target.value.replace(/\D/g, '');
                          field.onChange(onlyDigits);
                        }}
                        fullWidth
                        id="id_usuario"
                        label="ID Usuario"
                        placeholder="115130776"
                        inputProps={{
                          maxLength: 20,
                          inputMode: 'numeric',
                          pattern: '[0-9]*',
                        }}
                        error={Boolean(errors.id_usuario)}
                        helperText={errors.id_usuario ? errors.id_usuario.message : 'Ingrese la cédula de la persona, solo números y sin guiones. Ejemplo: 115130776'}
                        FormHelperTextProps={{
                          sx: {
                            mb: 1,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="nombre"
                    control={control}
                    render={({ field }) => (
                      <>
                        <TextField
                          {...field}
                          fullWidth
                          id="nombre"
                          label="Nombre"
                          error={Boolean(errors.nombre)}
                          onBlur={(event) => {
                            field.onBlur();
                            handleReviewNameField('nombre', event.target.value);
                          }}
                          helperText={
                            errors.nombre
                              ? errors.nombre.message
                              : checkingSuggestions.nombre
                                ? 'Revisando ortografia...'
                                : nameSuggestions.nombre
                                  ? `Sugerencia: ${nameSuggestions.nombre}`
                                  : ' '
                          }
                        />
                        {nameSuggestions.nombre ? (
                          <Button size="small" variant="text" onClick={() => applyNameSuggestion('nombre')} sx={{ mt: 0.5 }}>
                            Aplicar sugerencia
                          </Button>
                        ) : null}
                      </>
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="apellidos"
                    control={control}
                    render={({ field }) => (
                      <>
                        <TextField
                          {...field}
                          fullWidth
                          id="apellidos"
                          label="Apellidos"
                          error={Boolean(errors.apellidos)}
                          onBlur={(event) => {
                            field.onBlur();
                            handleReviewNameField('apellidos', event.target.value);
                          }}
                          helperText={
                            errors.apellidos
                              ? errors.apellidos.message
                              : checkingSuggestions.apellidos
                                ? 'Revisando ortografia...'
                                : nameSuggestions.apellidos
                                  ? `Sugerencia: ${nameSuggestions.apellidos}`
                                  : ' '
                          }
                        />
                        {nameSuggestions.apellidos ? (
                          <Button size="small" variant="text" onClick={() => applyNameSuggestion('apellidos')} sx={{ mt: 0.5 }}>
                            Aplicar sugerencia
                          </Button>
                        ) : null}
                      </>
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="genero"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors.genero)}>
                        <InputLabel id="genero-label">Género</InputLabel>
                        <Select
                          {...field}
                          labelId="genero-label"
                          id="genero"
                          label="Género"
                        >
                          {generoOptions.map((generoItem) => (
                            <MenuItem key={generoItem} value={generoItem}>
                              {generoItem}
                            </MenuItem>
                          ))}
                        </Select>
                        <Typography variant="caption" color="error" sx={{ minHeight: 20, mt: 0.5, ml: 1.5 }}>
                          {errors.genero ? errors.genero.message : ' '}
                        </Typography>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="id_rol"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors.id_rol)}>
                        <InputLabel id="id-rol-label">Rol</InputLabel>
                        <Select
                          {...field}
                          labelId="id-rol-label"
                          id="id_rol"
                          label="Rol"
                        >
                          {roleOptions.map((roleItem) => (
                            <MenuItem key={roleItem.id_rol} value={roleItem.id_rol}>
                              {roleItem.nombre_rol}
                            </MenuItem>
                          ))}
                        </Select>
                        <Typography variant="caption" color="error" sx={{ minHeight: 20, mt: 0.5, ml: 1.5 }}>
                          {errors.id_rol ? errors.id_rol.message : ' '}
                        </Typography>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={12} sm={6}>
                  <Controller
                    name="nivel"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors.nivel)}>
                        <InputLabel id="nivel-label">Nivel</InputLabel>
                        <Select
                          {...field}
                          labelId="nivel-label"
                          id="nivel"
                          label="Nivel"
                        >
                          {nivelOptions.map((nivelItem) => (
                            <MenuItem key={nivelItem} value={nivelItem}>
                              {nivelItem}
                            </MenuItem>
                          ))}
                        </Select>
                        <Typography variant="caption" color="error" sx={{ minHeight: 20, mt: 0.5, ml: 1.5 }}>
                          {errors.nivel ? errors.nivel.message : ' '}
                        </Typography>
                      </FormControl>
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
                        label={isEditMode ? 'Contraseña (dejar vacía para no cambiar)' : 'Contraseña'}
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
                        helperText={errors.password ? errors.password.message : 'Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 signo especial.'}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="passwordConfirm"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        id="passwordConfirm"
                        label={isEditMode ? 'Confirmar nueva contraseña' : 'Confirmar contraseña'}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="Mostrar u ocultar confirmación de contraseña"
                                onClick={() => setShowPassword((prev) => !prev)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        error={Boolean(errors.passwordConfirm)}
                        helperText={
                          errors.passwordConfirm
                            ? errors.passwordConfirm.message
                            : 'Debe coincidir exactamente con la contraseña ingresada.'
                        }
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
                  setIsEditMode(false);
                  setEditingUserId(null);
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={errorDialog.open}
            onClose={handleCloseErrorDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Error</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={1}>
                {errorDialog.messages.map((messageItem, index) => (
                  <Grid size={12} key={`${messageItem}-${index}`}>
                    <Typography>{`• ${messageItem}`}</Typography>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" color="primary" onClick={handleCloseErrorDialog} autoFocus>
                Aceptar
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={successDialog.open}
            onClose={handleCloseSuccessDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{successDialog.title}</DialogTitle>
            <DialogContent dividers>
              <Typography>{successDialog.message}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" color="primary" onClick={handleCloseSuccessDialog} autoFocus>
                Aceptar
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={resetPasswordDialog.open}
            onClose={closeResetPasswordDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogContent dividers>
              <Typography sx={{ mb: 2 }}>
                Usuario seleccionado: <strong>{resetPasswordDialog.userId}</strong>
              </Typography>
              <Grid container spacing={1}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Nueva contraseña"
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPasswordDialog.password}
                    onChange={(event) => setResetPasswordDialog((current) => ({ ...current, password: event.target.value }))}
                    helperText="Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 signo especial."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowResetPassword((prev) => !prev)} edge="end" aria-label="Mostrar u ocultar nueva contraseña">
                            {showResetPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Confirmar nueva contraseña"
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPasswordDialog.confirmPassword}
                    onChange={(event) => setResetPasswordDialog((current) => ({ ...current, confirmPassword: event.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowResetPassword((prev) => !prev)} edge="end" aria-label="Mostrar u ocultar confirmación de contraseña">
                            {showResetPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="outlined" onClick={closeResetPasswordDialog}>
                Cancelar
              </Button>
              <Button variant="contained" color="primary" onClick={handleResetPassword} disabled={isResettingPassword}>
                {isResettingPassword ? 'Guardando...' : 'Restablecer'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={logoutDialogOpen}
            onClose={handleCloseLogoutDialog}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Sesión cerrada</DialogTitle>
            <DialogContent dividers>
              <Typography>La sesión se cerró correctamente.</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" color="primary" onClick={handleCloseLogoutDialog} autoFocus>
                Aceptar
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteConfirmDialog.open} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
            <DialogTitle>Confirmar eliminación de usuario</DialogTitle>
            <DialogContent>
              <Typography sx={{ mt: 1 }}>
                ¿Está seguro que desea eliminar al usuario <strong>{deleteConfirmDialog.userName}</strong>?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Esta acción no se puede deshacer.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
              <Button variant="contained" color="error" onClick={handleConfirmDelete}>
                Eliminar usuario
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </form>
    </>
  );
}
