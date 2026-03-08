import React, { useEffect, useMemo, useState } from 'react';
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
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Menu from '@mui/material/Menu';
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
  const [subTaskMenuAnchorEl, setSubTaskMenuAnchorEl] = useState(null);
  const [selectedProjectSubTasks, setSelectedProjectSubTasks] = useState([]);
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
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: '',
    title: '',
    message: '',
  });
  const [pendingDataForm, setPendingDataForm] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const openErrorDialog = (title, messages) => {
    const normalizedMessages = Array.isArray(messages) ? messages.filter(Boolean) : [messages];
    setErrorDialog({
      open: true,
      title,
      messages: normalizedMessages,
    });
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({
      open: false,
      title: '',
      messages: [],
    });
  };

  const onError = (formErrors, event) => {
    console.log(formErrors, event);
    const missingFields = collectMissingFields(formErrors);

    if (missingFields.length > 0) {
      openErrorDialog(
        'Faltan campos obligatorios',
        missingFields.map((fieldName) => `Complete el campo: ${fieldName}`)
      );
      return;
    }

    const firstErrorMessage = Object.values(formErrors)[0]?.message;
    if (firstErrorMessage) {
      openErrorDialog('Revise el formulario', [firstErrorMessage]);
    }
  };

  const validateUniqueIdsBeforeSave = (dataForm) => {
    const normalizedProjectId = (dataForm.id_proyecto || '').trim().toLowerCase();
    const normalizedEditingProjectId = (editingProjectId || '').trim().toLowerCase();

    const formSubTaskIds = dataForm.sub_tareas
      .map((subTask) => (subTask.id_subtarea || '').trim().toLowerCase())
      .filter(Boolean);

    const subTaskIdCounts = formSubTaskIds.reduce((accumulator, idSubTask) => {
      accumulator[idSubTask] = (accumulator[idSubTask] || 0) + 1;
      return accumulator;
    }, {});

    const repeatedInForm = Object.entries(subTaskIdCounts)
      .filter(([, qty]) => qty > 1)
      .map(([idSubTask]) => idSubTask);

    const relevantProjects = isEditMode
      ? projects.filter((projectItem) => (projectItem.id_proyecto || '').trim().toLowerCase() !== normalizedEditingProjectId)
      : projects;

    const existingProjectIds = new Set(
      relevantProjects.map((projectItem) => (projectItem.id_proyecto || '').trim().toLowerCase())
    );

    const existingSubTaskIds = new Set(
      relevantProjects.flatMap((projectItem) =>
        Array.isArray(projectItem.sub_tareas)
          ? projectItem.sub_tareas.map((subTask) => (subTask.id_subtarea || '').trim().toLowerCase())
          : []
      )
    );

    const duplicateProjectId = existingProjectIds.has(normalizedProjectId);
    const alreadyUsedSubTaskIds = [...new Set(formSubTaskIds.filter((idSubTask) => existingSubTaskIds.has(idSubTask)))];

    if (!duplicateProjectId && repeatedInForm.length === 0 && alreadyUsedSubTaskIds.length === 0) {
      return true;
    }

    const errorMessages = [];

    if (duplicateProjectId) {
      errorMessages.push(`El ID de proyecto ${dataForm.id_proyecto} ya existe.`);
    }

    if (repeatedInForm.length > 0) {
      errorMessages.push(`Hay IDs de sub tareas repetidos en el formulario: ${repeatedInForm.join(', ')}.`);
    }

    if (alreadyUsedSubTaskIds.length > 0) {
      errorMessages.push(`Estos IDs de sub tareas ya existen: ${alreadyUsedSubTaskIds.join(', ')}.`);
    }

    openErrorDialog('No se puede guardar el proyecto', errorMessages);
    return false;
  };

  const loadProjects = async () => {
    const response = await ProjectService.getProjects();
    const apiProjects = Array.isArray(response.data) ? response.data : [];
    const normalizedProjects = apiProjects.map((projectItem) => ({
      ...projectItem,
      sub_tareas: Array.isArray(projectItem.sub_tareas) ? projectItem.sub_tareas : [],
    }));
    setProjects(normalizedProjects);
  };

  const saveProject = async (dataForm, editOperation = isEditMode) => {
    setIsSaving(true);
    try {
      const payloadProject = {
        id_proyecto: dataForm.id_proyecto,
        nombre_cliente: dataForm.nombre_cliente,
        nombre_proyecto: dataForm.nombre_proyecto,
        id_cliente: dataForm.id_cliente,
      };

      if (editOperation) {
        await SubTaskService.deleteSubTasksByProject(editingProjectId);

        await ProjectService.updateProject({
          ...payloadProject,
          id_proyecto_original: editingProjectId,
        });

        const subTaskResults = await SubTaskService.createSubTasksByProject(
          dataForm.id_proyecto,
          dataForm.sub_tareas
        );

        await loadProjects();

        const failedSubTasks = subTaskResults.filter((resultItem) => resultItem.status === 'rejected');

        setSuccessDialog({
          open: true,
          title: failedSubTasks.length > 0 ? 'Proyecto modificado con observaciones' : 'Proyecto modificado correctamente',
          message: failedSubTasks.length > 0
            ? `Se modificó el proyecto ${dataForm.nombre_proyecto}, pero ${failedSubTasks.length} sub tarea(s) no se pudieron guardar. Verifique que los IDs de sub tareas no estén repetidos.`
            : `Se modificó correctamente el proyecto ${dataForm.nombre_proyecto}.`,
        });
      } else {
        const projectResponse = await ProjectService.createProject(payloadProject);
        setError(projectResponse.error);

        const subTaskResults = await SubTaskService.createSubTasksByProject(
          dataForm.id_proyecto,
          dataForm.sub_tareas
        );

        await loadProjects();

        const failedSubTasks = subTaskResults.filter((resultItem) => resultItem.status === 'rejected');

        setSuccessDialog({
          open: true,
          title: failedSubTasks.length > 0 ? 'Proyecto agregado con observaciones' : 'Proyecto agregado correctamente',
          message: failedSubTasks.length > 0
            ? `Se agregó el proyecto ${dataForm.nombre_proyecto}, pero ${failedSubTasks.length} sub tarea(s) no se pudieron guardar. Verifique que los IDs de sub tareas no estén repetidos.`
            : `Se agregó correctamente el proyecto ${dataForm.nombre_proyecto}.`,
        });
      }

      reset(defaultValues);
      setIsEditMode(false);
      setEditingProjectId(null);
      setIsFormOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (dataForm) => {
    try {
      if (!validateUniqueIdsBeforeSave(dataForm)) {
        return;
      }

      if (isEditMode) {
        setPendingDataForm(dataForm);
        setConfirmDialog({
          open: true,
          type: 'edit',
          title: 'Confirmar edición',
          message: `¿Desea guardar los cambios del proyecto ${dataForm.nombre_proyecto}?`,
        });
        return;
      } else {
        await saveProject(dataForm, false);
      }

      return;
    } catch (submitError) {
      if (submitError instanceof SyntaxError) {
        console.log(submitError);
        setError(submitError);
        throw new Error('Respuesta no válida del servidor');
      }
      setError(submitError);
      openErrorDialog(
        isEditMode ? 'No se pudo modificar el proyecto' : 'No se pudo crear el proyecto',
        [
          isEditMode
            ? 'Ocurrió un error al actualizar el proyecto o sus sub tareas.'
            : 'Ocurrió un error al crear el proyecto o sus sub tareas.',
          'Revise que los IDs no estén repetidos y vuelva a intentarlo.',
        ]
      );
      console.error(submitError);
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      type: '',
      title: '',
      message: '',
    });
  };

  const handleConfirmDialogAction = async () => {
    try {
      setIsSaving(true);
      if (confirmDialog.type === 'edit' && pendingDataForm) {
        await saveProject(pendingDataForm, true);
        setPendingDataForm(null);
      }

      if (confirmDialog.type === 'delete' && pendingDeleteId) {
        await ProjectService.deleteProject(pendingDeleteId);
        await loadProjects();

        setSuccessDialog({
          open: true,
          title: 'Proyecto eliminado correctamente',
          message: 'El proyecto se eliminó correctamente.',
        });
        setPendingDeleteId(null);
      }
    } catch (serviceError) {
      console.error(serviceError);
      openErrorDialog(
        confirmDialog.type === 'delete' ? 'No se pudo eliminar el proyecto' : 'No se pudo modificar el proyecto',
        [
          confirmDialog.type === 'delete'
            ? 'Ocurrió un error al eliminar el proyecto.'
            : 'Ocurrió un error al modificar el proyecto.',
        ]
      );
    } finally {
      setIsSaving(false);
      handleCloseConfirmDialog();
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
    setPendingDeleteId(projectId);
    setConfirmDialog({
      open: true,
      type: 'delete',
      title: 'Confirmar eliminación',
      message: '¿Desea eliminar este proyecto?',
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

  const handleOpenSubTaskMenu = (event, subTasks) => {
    setSubTaskMenuAnchorEl(event.currentTarget);
    setSelectedProjectSubTasks(Array.isArray(subTasks) ? subTasks : []);
  };

  const handleCloseSubTaskMenu = () => {
    setSubTaskMenuAnchorEl(null);
    setSelectedProjectSubTasks([]);
  };

  useEffect(() => {
    loadProjects().catch((serviceError) => {
      console.error(serviceError);
      toast.error('No se pudieron cargar los proyectos existentes');
    });
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((projectItem) => {
      const filterText = projectFilter.trim().toLowerCase();
      const matchesProject =
        filterText === '' ||
        projectItem.id_proyecto
          .toLowerCase()
          .includes(filterText) ||
        projectItem.nombre_proyecto
          .toLowerCase()
          .includes(filterText);

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
      <form id="create-project-form" onSubmit={handleSubmit(onSubmit, onError)} noValidate>
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
                  Volver al Menú
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
                    label="Buscar Proyecto (ID o Nombre)"
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
                  <TableHead sx={{ backgroundColor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>ID Proyecto</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '30%' }}>Nombre del Proyecto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: 120, pr: 1 }}>Sub Tareas</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
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
                          <TableCell sx={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {projectItem.nombre_proyecto}
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(event) => handleOpenSubTaskMenu(event, projectItem.sub_tareas)}
                              disabled={!projectItem.sub_tareas?.length}
                              endIcon={<ArrowDropDownIcon />}
                            >
                              {projectItem.sub_tareas?.length || 0}
                            </Button>
                          </TableCell>
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

          <Grid size={12} sx={{ m: 1, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sub tareas del proyecto
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
              <Button
                type="button"
                variant="contained"
                color="primary"
                form="create-project-form"
                onClick={handleSubmit(onSubmit, onError)}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Guardar'}
              </Button>
            </DialogActions>
          </Dialog>

          <Menu
            open={Boolean(subTaskMenuAnchorEl)}
            onClose={handleCloseSubTaskMenu}
            anchorEl={subTaskMenuAnchorEl}
            keepMounted
          >
            {selectedProjectSubTasks.length === 0 ? (
              <MenuItem disabled>Sin sub tareas</MenuItem>
            ) : (
              selectedProjectSubTasks.map((subTaskItem) => (
                <MenuItem key={subTaskItem.id_subtarea} onClick={handleCloseSubTaskMenu}>
                  {`${subTaskItem.id_subtarea} - ${subTaskItem.nombre_tarea}`}
                </MenuItem>
              ))
            )}
          </Menu>

          <Dialog
            open={errorDialog.open}
            onClose={handleCloseErrorDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{errorDialog.title}</DialogTitle>
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
            open={confirmDialog.open}
            onClose={handleCloseConfirmDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent dividers>
              <Typography>{confirmDialog.message}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleCloseConfirmDialog}>
                Cancelar
              </Button>
              <Button variant="contained" color="primary" onClick={handleConfirmDialogAction} disabled={isSaving}>
                {isSaving ? 'Procesando...' : 'Aceptar'}
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
