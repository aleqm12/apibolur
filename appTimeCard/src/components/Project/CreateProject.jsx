import React, { useMemo, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProjectService from '../../services/ProjectService';
import SubTaskService from '../../services/SubTaskService';

export function CreateProject() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

  const fieldLabels = {
    id_proyecto: 'ID del proyecto',
    nombre_cliente: 'Nombre del cliente',
    nombre_proyecto: 'Nombre del proyecto',
    id_cliente: 'ID del cliente',
    id_subtarea: 'ID de la sub tarea',
    nombre_tarea: 'Nombre de la sub tarea',
  };

  const defaultValues = {
    id_proyecto: '',
    nombre_cliente: '',
    nombre_proyecto: '',
    id_cliente: '',
    sub_tareas: [
      {
        id_subtarea: '',
        nombre_tarea: '',
      },
    ],
  };

  const projectSchema = yup.object({
    id_proyecto: yup
      .string()
      .required('El ID del proyecto es requerido')
      .max(20, 'El ID del proyecto debe tener máximo 20 caracteres'),
    nombre_cliente: yup
      .string()
      .required('El nombre del cliente es requerido')
      .max(150, 'El nombre del cliente debe tener máximo 150 caracteres'),
    nombre_proyecto: yup
      .string()
      .required('El nombre del proyecto es requerido')
      .max(150, 'El nombre del proyecto debe tener máximo 150 caracteres'),
    id_cliente: yup
      .string()
      .required('El ID del cliente es requerido')
      .max(20, 'El ID del cliente debe tener máximo 20 caracteres'),
    sub_tareas: yup
      .array()
      .of(
        yup.object({
          id_subtarea: yup
            .string()
            .required('El ID de la sub tarea es requerido')
            .max(20, 'El ID de la sub tarea debe tener máximo 20 caracteres'),
          nombre_tarea: yup
            .string()
            .required('El nombre de la sub tarea es requerido')
            .max(150, 'El nombre de la sub tarea debe tener máximo 150 caracteres'),
        })
      )
      .min(1, 'Debe agregar al menos una sub tarea'),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(projectSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sub_tareas',
  });

  const addSubTask = () => {
    append({
      id_subtarea: '',
      nombre_tarea: '',
    });
  };

  const removeSubTask = (index) => {
    if (fields.length === 1) {
      return;
    }
    remove(index);
  };

  const collectMissingFields = (formErrors, prefix = '') => {
    if (!formErrors || typeof formErrors !== 'object') {
      return [];
    }

    return Object.entries(formErrors).flatMap(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (!value || typeof value !== 'object') {
        return [];
      }

      if (value.type === 'required') {
        const label = fieldLabels[key] || key;
        if (prefix.startsWith('sub_tareas.')) {
          const subTaskIndex = Number(prefix.split('.')[1]) + 1;
          return [`Sub tarea #${subTaskIndex}: ${label}`];
        }
        return [label];
      }

      return collectMissingFields(value, currentPath);
    });
  };

  const onError = (formErrors, event) => {
    console.log(formErrors, event);
    const missingFields = collectMissingFields(formErrors);

    if (missingFields.length > 0) {
      toast.error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
      return;
    }

    const firstErrorMessage = Object.values(formErrors)[0]?.message;
    if (firstErrorMessage) {
      toast.error(firstErrorMessage);
    }
  };

  const onSubmit = async (dataForm) => {
    try {
      const payloadProject = {
        id_proyecto: dataForm.id_proyecto,
        nombre_cliente: dataForm.nombre_cliente,
        nombre_proyecto: dataForm.nombre_proyecto,
        id_cliente: dataForm.id_cliente,
      };

      if (isEditMode) {
        setProjects((prevProjects) =>
          prevProjects.map((projectItem) =>
            projectItem.id_proyecto === editingProjectId
              ? { ...payloadProject, sub_tareas: dataForm.sub_tareas }
              : projectItem
          )
        );

        setSuccessDialog({
          open: true,
          title: 'Proyecto modificado correctamente',
          message: `Se modificó correctamente el proyecto ${dataForm.nombre_proyecto}.`,
        });
      } else {
        const projectResponse = await ProjectService.createProject(payloadProject);
        setError(projectResponse.error);

        await SubTaskService.createSubTasksByProject(
          dataForm.id_proyecto,
          dataForm.sub_tareas
        );

        setProjects((prevProjects) => [
          {
            ...payloadProject,
            sub_tareas: dataForm.sub_tareas,
          },
          ...prevProjects,
        ]);

        setSuccessDialog({
          open: true,
          title: 'Proyecto agregado correctamente',
          message: `Se agregó correctamente el proyecto ${dataForm.nombre_proyecto}.`,
        });
      }

      reset(defaultValues);
      setIsEditMode(false);
      setEditingProjectId(null);
      setIsFormOpen(false);
      return;
    } catch (submitError) {
      if (submitError instanceof SyntaxError) {
        console.log(submitError);
        setError(submitError);
        throw new Error('Respuesta no válida del servidor');
      }
      setError(submitError);
      toast.error(isEditMode ? 'No se pudo modificar el proyecto' : 'No se pudo crear el proyecto con sus sub tareas');
      console.error(submitError);
    }
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  const handleEditProject = (projectItem) => {
    setIsEditMode(true);
    setEditingProjectId(projectItem.id_proyecto);
    reset({
      id_proyecto: projectItem.id_proyecto,
      nombre_cliente: projectItem.nombre_cliente || '',
      nombre_proyecto: projectItem.nombre_proyecto,
      id_cliente: projectItem.id_cliente,
      sub_tareas: projectItem.sub_tareas?.length
        ? projectItem.sub_tareas
        : [
            {
              id_subtarea: '',
              nombre_tarea: '',
            },
          ],
    });
    setIsFormOpen(true);
  };

  const handleDeleteProject = (projectId) => {
    const confirmed = window.confirm('¿Desea eliminar este proyecto?');
    if (!confirmed) {
      return;
    }

    setProjects((prevProjects) =>
      prevProjects.filter((projectItem) => projectItem.id_proyecto !== projectId)
    );
    toast.success('Proyecto eliminado con éxito', {
      duration: 3000,
      position: 'top-center',
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Sesión cerrada correctamente', {
      duration: 3000,
      position: 'top-center',
    });
    navigate('/');
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((projectItem) => {
      const matchesProject =
        projectFilter.trim() === '' ||
        projectItem.nombre_proyecto
          .toLowerCase()
          .includes(projectFilter.trim().toLowerCase());

      const matchesClient =
        clientFilter.trim() === '' ||
        (projectItem.nombre_cliente || '').toLowerCase() === clientFilter.toLowerCase();

      return matchesProject && matchesClient;
    });
  }, [projects, projectFilter, clientFilter]);

  const clientOptions = useMemo(() => {
    return [...new Set(projects.map((projectItem) => projectItem.nombre_cliente).filter(Boolean))].sort();
  }, [projects]);

  if (error && error.message) return <p>Error: {error.message}</p>;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
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
                  Creación de Proyectos
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
                  Volver al Panel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={12}>
            <Typography variant="h5" gutterBottom sx={{ px: { xs: 2, md: 3 } }}>
              Gestión de Proyectos
            </Typography>
          </Grid>

          <Grid size={12} sx={{ px: { xs: 2, md: 3 }, mb: 1 }}>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={() => {
                setIsEditMode(false);
                setEditingProjectId(null);
                reset(defaultValues);
                setIsFormOpen(true);
              }}
            >
              + Nuevo Proyecto
            </Button>
          </Grid>

          <Grid size={12} sx={{ px: { xs: 2, md: 3 }, mb: 1 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Buscar Proyecto (Nombre)"
                    value={projectFilter}
                    onChange={(event) => setProjectFilter(event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="cliente-filter-label">Filtrar por Cliente</InputLabel>
                    <Select
                      labelId="cliente-filter-label"
                      id="cliente-filter"
                      value={clientFilter}
                      label="Filtrar por Cliente"
                      onChange={(event) => setClientFilter(event.target.value)}
                    >
                      <MenuItem value="">Todos los clientes</MenuItem>
                      {clientOptions.map((clientId) => (
                        <MenuItem key={clientId} value={clientId}>
                          {clientId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={12} sx={{ px: { xs: 2, md: 3 }, mb: 2 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Cliente</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>ID Proyecto</TableCell>
                      <TableCell>Nombre del Proyecto</TableCell>
                      <TableCell align="right">Sub Tareas</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Aún no hay proyectos creados en esta sesión.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((projectItem) => (
                        <TableRow key={projectItem.id_proyecto} hover>
                          <TableCell>{projectItem.id_cliente}</TableCell>
                          <TableCell>{projectItem.nombre_cliente}</TableCell>
                          <TableCell>{projectItem.id_proyecto}</TableCell>
                          <TableCell>{projectItem.nombre_proyecto}</TableCell>
                          <TableCell align="right">{projectItem.sub_tareas.length}</TableCell>
                          <TableCell align="center">
                            <IconButton color="primary" onClick={() => handleEditProject(projectItem)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteProject(projectItem.id_proyecto)}>
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
              setIsFormOpen(false);
            }}
            fullWidth
            maxWidth="lg"
          >
            <DialogTitle>{isEditMode ? 'Editar Proyecto' : 'Formulario de Nuevo Proyecto'}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={1} sx={{ pt: 1 }}>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="id_proyecto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_proyecto"
                    label="ID Proyecto"
                    error={Boolean(errors.id_proyecto)}
                    helperText={errors.id_proyecto ? errors.id_proyecto.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="nombre_proyecto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="nombre_proyecto"
                    label="Nombre del Proyecto"
                    error={Boolean(errors.nombre_proyecto)}
                    helperText={errors.nombre_proyecto ? errors.nombre_proyecto.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="nombre_cliente"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="nombre_cliente"
                    label="Nombre del Cliente"
                    error={Boolean(errors.nombre_cliente)}
                    helperText={errors.nombre_cliente ? errors.nombre_cliente.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="id_cliente"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_cliente"
                    label="ID Cliente"
                    error={Boolean(errors.id_cliente)}
                    helperText={errors.id_cliente ? errors.id_cliente.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sx={{ m: 1, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sub tareas del proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estas sub tareas se almacenan en la tabla sub_tareas.
            </Typography>
          </Grid>

          {fields.map((item, index) => (
            <React.Fragment key={item.id}>
              <Grid size={12} sm={4}>
                <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                  <Controller
                    name={`sub_tareas.${index}.id_subtarea`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id={`id_subtarea_${index}`}
                        label={`ID Sub tarea #${index + 1}`}
                        error={Boolean(errors.sub_tareas?.[index]?.id_subtarea)}
                        helperText={errors.sub_tareas?.[index]?.id_subtarea?.message || ' '}
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={12} sm={6}>
                <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
                  <Controller
                    name={`sub_tareas.${index}.nombre_tarea`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id={`nombre_tarea_${index}`}
                        label={`Nombre Sub tarea #${index + 1}`}
                        error={Boolean(errors.sub_tareas?.[index]?.nombre_tarea)}
                        helperText={errors.sub_tareas?.[index]?.nombre_tarea?.message || ' '}
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Eliminar sub tarea">
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => removeSubTask(index)}
                      disabled={fields.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            </React.Fragment>
          ))}

          <Grid size={12} sx={{ m: 1 }}>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={addSubTask}
              startIcon={<AddIcon />}
            >
              Agregar sub tarea
            </Button>
            {errors.sub_tareas?.message ? (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {errors.sub_tareas.message}
              </Typography>
            ) : null}
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
                  setIsEditMode(false);
                  setEditingProjectId(null);
                  setIsFormOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {isEditMode ? 'Guardar Cambios' : 'Guardar'}
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
        </Grid>
      </form>
    </>
  );
}
