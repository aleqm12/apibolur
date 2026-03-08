import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import toast from 'react-hot-toast';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import ProjectService from '../../services/ProjectService';
import RegistroHorasService from '../../services/RegistroHorasService';

const HORAS_MAXIMAS_DIA = 10;
const MAX_DIAS_PERIODO = 14;

const getTodayIso = () => format(new Date(), 'yyyy-MM-dd');
const getDefaultPeriodEndIso = (periodStart) => format(addDays(parseISO(periodStart), 6), 'yyyy-MM-dd');
const getMaxPeriodEndIso = (periodStart) => format(addDays(parseISO(periodStart), MAX_DIAS_PERIODO - 1), 'yyyy-MM-dd');

const buildWeekDays = (periodStart, periodEnd) => {
  const startDate = parseISO(periodStart);
  const endDate = parseISO(periodEnd);
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const safeTotalDays = Number.isFinite(totalDays) && totalDays > 0 ? totalDays : 1;

  return Array.from({ length: safeTotalDays }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      iso: format(date, 'yyyy-MM-dd'),
      dayLabel: format(date, 'EEE dMMM', { locale: es }),
    };
  });
};

const buildHoursByWeek = (weekDays, previousHours = {}) => {
  return weekDays.reduce((accumulator, day) => {
    accumulator[day.iso] = previousHours[day.iso] || '';
    return accumulator;
  }, {});
};

const buildEmptyRow = (weekDays) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  id_proyecto: '',
  id_subtarea: '',
  comentarios: '',
  estado_aprobacion: 'Pendiente',
  horasPorDia: buildHoursByWeek(weekDays),
});

const buildRowFromRegistro = (weekDays, registro, projectIdFromSubTaskMap) => ({
  id: `db-${registro.id_registro || Math.random().toString(36).slice(2, 8)}`,
  id_proyecto: registro.id_proyecto || projectIdFromSubTaskMap[registro.id_subtarea] || '',
  id_subtarea: registro.id_subtarea || '',
  comentarios: registro.comentarios || '',
  estado_aprobacion: 'Pendiente',
  horasPorDia: buildHoursByWeek(weekDays, {
    [registro.fecha]: Number(registro.horas),
  }),
});

const buildRowKey = (row) => {
  return [row.id_proyecto || '', row.id_subtarea || '', (row.comentarios || '').trim()].join('|');
};

const normalizeHourValue = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return '';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return '';
  }

  const normalizedValue = Math.round(numericValue * 2) / 2;
  return normalizedValue > HORAS_MAXIMAS_DIA ? HORAS_MAXIMAS_DIA : normalizedValue;
};

const sumHours = (hoursByDay) => {
  return Object.values(hoursByDay).reduce((accumulator, rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return accumulator;
    }
    return accumulator + value;
  }, 0);
};

const pendienteChipSx = {
  bgcolor: '#ffeb3b',
  color: '#4e342e',
  fontWeight: 700,
  border: '1px solid rgba(78, 52, 46, 0.25)',
};

export function CreateRegistrodeHoras() {
  const navigate = useNavigate();
  const storedAuthUser = localStorage.getItem('authUser');
  let currentUser = null;

  try {
    currentUser = storedAuthUser ? JSON.parse(storedAuthUser) : null;
  } catch {
    currentUser = null;
  }

  const idUsuario = currentUser?.id_usuario || '';
  const userFullName = `${currentUser?.nombre || ''} ${currentUser?.apellidos || ''}`.trim();
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0].toUpperCase())
    .join('') || 'US';
  const [periodStart, setPeriodStart] = useState(() => getTodayIso());
  const [periodEnd, setPeriodEnd] = useState(() => getDefaultPeriodEndIso(getTodayIso()));
  const [projects, setProjects] = useState([]);
  const [filterCliente, setFilterCliente] = useState('');
  const [filterBusqueda, setFilterBusqueda] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [rows, setRows] = useState(() => [buildEmptyRow(buildWeekDays(getTodayIso(), getDefaultPeriodEndIso(getTodayIso())))]);

  const weekDays = useMemo(() => buildWeekDays(periodStart, periodEnd), [periodStart, periodEnd]);

  useEffect(() => {
    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        horasPorDia: buildHoursByWeek(weekDays, row.horasPorDia),
      }))
    );
  }, [weekDays]);

  useEffect(() => {
    if (!idUsuario) {
      navigate('/user/login');
      return;
    }

    const loadProjects = async () => {
      try {
        const response = await ProjectService.getProjects();
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch {
        toast.error('No fue posible cargar proyectos y sub-tareas.');
      }
    };

    loadProjects();
  }, [idUsuario, navigate]);

  const projectMap = useMemo(() => {
    return projects.reduce((accumulator, project) => {
      accumulator[project.id_proyecto] = project;
      return accumulator;
    }, {});
  }, [projects]);

  const projectIdFromSubTaskMap = useMemo(() => {
    const map = {};

    projects.forEach((project) => {
      if (!Array.isArray(project.sub_tareas)) {
        return;
      }

      project.sub_tareas.forEach((subTask) => {
        map[subTask.id_subtarea] = project.id_proyecto;
      });
    });

    return map;
  }, [projects]);

  const loadRowsByUserAndPeriod = useCallback(async (preferredOrderKeys = []) => {
    try {
      const response = await RegistroHorasService.getByUser(idUsuario);
      const registros = Array.isArray(response?.data) ? response.data : [];

      const filteredRegistros = registros.filter((registro) => {
        return registro.fecha >= periodStart && registro.fecha <= periodEnd;
      });

      if (filteredRegistros.length === 0) {
        setRows([buildEmptyRow(weekDays)]);
        return;
      }

      const groupedRows = filteredRegistros.reduce((accumulator, registro) => {
        const groupKey = [
          registro.id_proyecto || projectIdFromSubTaskMap[registro.id_subtarea] || '',
          registro.id_subtarea || '',
          (registro.comentarios || '').trim(),
        ].join('|');

        if (!accumulator[groupKey]) {
          accumulator[groupKey] = buildRowFromRegistro(weekDays, registro, projectIdFromSubTaskMap);
        } else {
          accumulator[groupKey].horasPorDia[registro.fecha] = Number(registro.horas);
        }

        return accumulator;
      }, {});

      const hydratedRows = Object.values(groupedRows);

      if (preferredOrderKeys.length > 0) {
        const orderMap = preferredOrderKeys.reduce((accumulator, key, index) => {
          accumulator[key] = index;
          return accumulator;
        }, {});

        hydratedRows.sort((a, b) => {
          const keyA = buildRowKey(a);
          const keyB = buildRowKey(b);
          const indexA = Object.prototype.hasOwnProperty.call(orderMap, keyA) ? orderMap[keyA] : Number.MAX_SAFE_INTEGER;
          const indexB = Object.prototype.hasOwnProperty.call(orderMap, keyB) ? orderMap[keyB] : Number.MAX_SAFE_INTEGER;

          if (indexA === indexB) {
            return keyA.localeCompare(keyB);
          }

          return indexA - indexB;
        });
      }

      setRows(hydratedRows.length > 0 ? hydratedRows : [buildEmptyRow(weekDays)]);
    } catch {
      toast.error('No fue posible cargar los registros guardados del periodo.');
    }
  }, [idUsuario, periodStart, periodEnd, weekDays, projectIdFromSubTaskMap]);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    loadRowsByUserAndPeriod();
  }, [projects, loadRowsByUserAndPeriod]);

  const handleAddRow = () => {
    setRows((currentRows) => [...currentRows, buildEmptyRow(weekDays)]);
  };

  const handleToggleRow = (rowId, checked) => {
    setSelectedRowIds((currentSelectedRows) => {
      if (checked) {
        return [...new Set([...currentSelectedRows, rowId])];
      }
      return currentSelectedRows.filter((selectedId) => selectedId !== rowId);
    });
  };

  const handleDeleteRows = () => {
    setRows((currentRows) => {
      const nextRows = currentRows.filter((row) => !selectedRowIds.includes(row.id));
      if (nextRows.length > 0) {
        return nextRows;
      }
      return [buildEmptyRow(weekDays)];
    });
    setSelectedRowIds([]);
  };

  const updateRow = (rowId, updater) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === rowId ? updater(row) : row)));
  };

  const handleProjectChange = (rowId, idProyecto) => {
    updateRow(rowId, (currentRow) => ({
      ...currentRow,
      id_proyecto: idProyecto,
      id_subtarea: '',
    }));
  };

  const handleSubTaskChange = (rowId, idSubTarea) => {
    updateRow(rowId, (currentRow) => ({
      ...currentRow,
      id_subtarea: idSubTarea,
    }));
  };

  const handleCommentChange = (rowId, comentarios) => {
    updateRow(rowId, (currentRow) => ({
      ...currentRow,
      comentarios,
    }));
  };

  const handleHourChange = (rowId, dayIso, value) => {
    updateRow(rowId, (currentRow) => ({
      ...currentRow,
      horasPorDia: {
        ...currentRow.horasPorDia,
        [dayIso]: normalizeHourValue(value),
      },
    }));
  };

  const getSubTasksByProject = (idProyecto) => {
    if (!idProyecto || !projectMap[idProyecto]) {
      return [];
    }

    return Array.isArray(projectMap[idProyecto].sub_tareas) ? projectMap[idProyecto].sub_tareas : [];
  };

  const getProjectDisplayName = (idProyecto) => {
    if (!idProyecto || !projectMap[idProyecto]) {
      return idProyecto || 'Proyecto sin nombre';
    }

    return projectMap[idProyecto].nombre_proyecto || idProyecto;
  };

  const getSubTaskDisplayName = (idProyecto, idSubTarea) => {
    const subTasks = getSubTasksByProject(idProyecto);
    const matchedSubTask = subTasks.find((subTask) => subTask.id_subtarea === idSubTarea);

    return matchedSubTask?.nombre_tarea || idSubTarea || 'Sub-tarea sin nombre';
  };

  const totalHoras = useMemo(() => {
    return rows.reduce((accumulator, row) => accumulator + sumHours(row.horasPorDia), 0);
  }, [rows]);

  const clientOptions = useMemo(() => {
    const optionMap = {};

    rows.forEach((row) => {
      const currentProject = projectMap[row.id_proyecto];
      const idCliente = (currentProject?.id_cliente || '').trim();
      const nombreCliente = (currentProject?.nombre_cliente || '').trim();

      if (!idCliente || !nombreCliente) {
        return;
      }

      optionMap[idCliente] = nombreCliente;
    });

    return Object.entries(optionMap)
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [rows, projectMap]);

  const filteredRows = useMemo(() => {
    const search = filterBusqueda.trim().toLowerCase();

    return rows.filter((row) => {
      const currentProject = projectMap[row.id_proyecto];
      const projectName = (currentProject?.nombre_proyecto || '').toLowerCase();
      const idCliente = (currentProject?.id_cliente || '').toLowerCase();

      const matchesCliente = !filterCliente || idCliente === filterCliente.toLowerCase();
      const matchesSearch = !search || projectName.includes(search);

      return matchesCliente && matchesSearch;
    });
  }, [rows, filterCliente, filterBusqueda, projectMap]);

  const parseRowsToPayload = () => {
    const validationErrors = [];

    const rowsWithHours = rows.filter((row) => sumHours(row.horasPorDia) > 0);
    const duplicateProjectSubTaskPairs = rowsWithHours
      .filter((row) => row.id_proyecto && row.id_subtarea)
      .reduce((accumulator, row) => {
        const pairKey = `${row.id_proyecto.trim()}|${row.id_subtarea.trim()}`;
        accumulator[pairKey] = (accumulator[pairKey] || 0) + 1;
        return accumulator;
      }, {});

    const repeatedPairs = Object.entries(duplicateProjectSubTaskPairs)
      .filter(([, count]) => count > 1)
      .map(([pairKey]) => {
        const [idProyecto, idSubTarea] = pairKey.split('|');
        const projectName = getProjectDisplayName(idProyecto);
        const subTaskName = getSubTaskDisplayName(idProyecto, idSubTarea);
        return `Proyecto ${projectName} / Sub-tarea ${subTaskName}`;
      });

    if (repeatedPairs.length > 0) {
      validationErrors.push(`No puede repetir la combinación Proyecto + Sub-tarea: ${repeatedPairs.join(', ')}.`);
    }

    const registros = rows.flatMap((row, rowIndex) => {
      const horasFila = sumHours(row.horasPorDia);
      const hasProject = Boolean((row.id_proyecto || '').trim());
      const hasSubTask = Boolean((row.id_subtarea || '').trim());
      const hasComments = Boolean((row.comentarios || '').trim());
      const hasAnyHoursValue = Object.values(row.horasPorDia).some((value) => {
        return value !== '' && value !== null && typeof value !== 'undefined';
      });
      const isPartiallyCompletedRow = hasProject || hasSubTask || hasComments || hasAnyHoursValue;

      if (horasFila === 0) {
        if (isPartiallyCompletedRow) {
          validationErrors.push(`Fila ${rowIndex + 1}: debe ingresar la cantidad de horas antes de guardar.`);
        }
        return [];
      }

      if (!row.id_proyecto) {
        validationErrors.push(`Fila ${rowIndex + 1}: seleccione un proyecto.`);
      }

      if (!row.id_subtarea) {
        validationErrors.push(`Fila ${rowIndex + 1}: seleccione una sub-tarea.`);
      }

      if (!idUsuario.trim()) {
        validationErrors.push('Debe indicar el ID de usuario.');
      }

      return weekDays
        .map((day) => {
          const horas = Number(row.horasPorDia[day.iso]);
          if (!Number.isFinite(horas) || horas <= 0) {
            return null;
          }

          if (horas > HORAS_MAXIMAS_DIA) {
            validationErrors.push(`La cantidad máxima por día es ${HORAS_MAXIMAS_DIA} hrs.`);
            return null;
          }

          return {
            id_usuario: idUsuario.trim(),
            id_subtarea: row.id_subtarea,
            fecha: day.iso,
            horas: Number(horas.toFixed(2)),
            comentarios: row.comentarios?.trim() ? row.comentarios.trim() : null,
            estado_aprobacion: 'Pendiente',
          };
        })
        .filter(Boolean);
    });

    return {
      registros,
      validationErrors,
    };
  };

  const handleSave = async () => {
    const { registros, validationErrors } = parseRowsToPayload();

    if (validationErrors.length > 0) {
      setErrorDialog({
        open: true,
        title: 'No se puede guardar',
        message: validationErrors[0],
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await RegistroHorasService.createBatch({
        registros,
        sync_period: {
          id_usuario: idUsuario.trim(),
          fecha_inicio: periodStart,
          fecha_fin: periodEnd,
        },
      });
      const totalInsertados = response?.data?.total_insertados || 0;
      const totalEliminados = response?.data?.total_eliminados || 0;
      const totalErrores = response?.data?.total_errores || 0;

      if (totalErrores === 0) {
        if (totalInsertados === 0) {
          setSuccessDialog({
            open: true,
            title: 'Periodo actualizado',
            message: totalEliminados > 0
              ? `Se eliminaron ${totalEliminados} registros del periodo y no quedaron filas guardadas.`
              : 'No hay registros para guardar en el periodo seleccionado.',
          });
        } else {
          setSuccessDialog({
            open: true,
            title: 'Guardado exitoso',
            message: `Se guardaron ${totalInsertados} registros de horas correctamente.`,
          });
        }
      } else if (totalInsertados > 0 && totalErrores > 0) {
        setSuccessDialog({
          open: true,
          title: 'Guardado completado con observaciones',
          message: `Se guardaron ${totalInsertados} registros y ${totalErrores} quedaron con error.`,
        });
      } else {
        toast.error('No se logró guardar ningún registro.');
      }

      const preferredOrderKeys = rows.map((row) => buildRowKey(row));
      await loadRowsByUserAndPeriod(preferredOrderKeys);
      setSelectedRowIds([]);
    } catch {
      toast.error('No fue posible guardar la hoja de tiempo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePeriodStartChange = (newStartDate) => {
    setPeriodStart(newStartDate);
    const maxEndForStart = getMaxPeriodEndIso(newStartDate);

    if (newStartDate > periodEnd) {
      setPeriodEnd(newStartDate);
      return;
    }

    if (periodEnd > maxEndForStart) {
      setPeriodEnd(maxEndForStart);
    }
  };

  const handlePeriodEndChange = (newEndDate) => {
    const maxEndForStart = getMaxPeriodEndIso(periodStart);

    if (newEndDate < periodStart) {
      setPeriodEnd(periodStart);
      return;
    }

    if (newEndDate > maxEndForStart) {
      setPeriodEnd(maxEndForStart);
      toast.error('El periodo máximo permitido es de 14 días.');
      return;
    }

    setPeriodEnd(newEndDate);
  };

  const formattedEndDate = format(parseISO(periodEnd), 'MM/dd/yyyy');
  const formattedStartDate = format(parseISO(periodStart), 'MM/dd/yyyy');

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLogoutDialogOpen(true);
  };

  const handleCloseLogoutDialog = () => {
    setLogoutDialogOpen(false);
    navigate('/');
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  const closeErrorDialog = () => {
    setErrorDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 6rem)', bgcolor: '#f4f6f8' }}>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          borderRadius: 0,
          bgcolor: '#4f88b5',
          color: '#ecf6ff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              {userInitials}
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Hoja de tiempo
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {userFullName || 'Usuario'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                ID: {idUsuario || 'sin definir'}
              </Typography>
            </Box>
          </Stack>
          <Button variant="outlined" sx={{ color: '#ecf6ff', borderColor: '#ecf6ff' }} onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 0 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{ pl: { xs: 0.5, md: 1.5 } }}
        >
          <TextField
            label="Fecha inicio del periodo"
            type="date"
            value={periodStart}
            onChange={(event) => handlePeriodStartChange(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ lang: 'es-CR' }}
          />
          <TextField
            label="Fecha final del periodo"
            type="date"
            value={periodEnd}
            onChange={(event) => handlePeriodEndChange(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: periodStart, max: getMaxPeriodEndIso(periodStart), lang: 'es-CR' }}
          />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Fecha inicio: {formattedStartDate} | Fecha final: {formattedEndDate}
          </Typography>
          <Chip label="Pendiente de envío" sx={pendienteChipSx} />
        </Stack>
      </Paper>

      <Divider />

      <Box sx={{ px: { xs: 1, md: 2 }, pb: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ pt: 2, pb: 1 }}>
          <Select
            value={filterCliente}
            onChange={(event) => setFilterCliente(event.target.value)}
            size="small"
            displayEmpty
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">Filtrar por cliente</MenuItem>
            {clientOptions.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.nombre}
              </MenuItem>
            ))}
          </Select>
          <TextField
            value={filterBusqueda}
            onChange={(event) => setFilterBusqueda(event.target.value)}
            size="small"
            placeholder="Buscar por nombre del proyecto..."
            sx={{ minWidth: { xs: '100%', md: 420 } }}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setFilterCliente('');
              setFilterBusqueda('');
            }}
            disabled={!filterCliente && !filterBusqueda}
          >
            Limpiar filtros
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ py: 2 }}>
          <Button variant="outlined" onClick={handleAddRow}>
            Nueva fila
          </Button>
          <Button variant="outlined" color="error" onClick={handleDeleteRows} disabled={selectedRowIds.length === 0}>
            Borrar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Stack>

        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  bgcolor: '#dfe7ef',
                  color: '#243447',
                  fontWeight: 800,
                  borderBottom: '2px solid #c5d2df',
                },
              }}
            >
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Cliente</TableCell>
                <TableCell>Proyecto</TableCell>
                <TableCell>Sub-tarea</TableCell>
                <TableCell>Comentarios</TableCell>
                <TableCell>Estado</TableCell>
                {weekDays.map((day) => (
                  <TableCell key={day.iso} align="center" sx={{ minWidth: 90 }}>
                    {day.dayLabel}
                  </TableCell>
                ))}
                <TableCell align="right">Total (hrs)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => {
                const selectedProject = projectMap[row.id_proyecto];
                const subTasks = getSubTasksByProject(row.id_proyecto);
                const rowTotal = sumHours(row.horasPorDia);
                const isRowSelected = selectedRowIds.includes(row.id);

                return (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      backgroundColor: isRowSelected ? '#f7f8fa' : 'transparent',
                      '&:hover': {
                        backgroundColor: isRowSelected ? '#f2f4f7' : '#fafbfc',
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isRowSelected}
                        onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      {selectedProject?.nombre_cliente || '-'}
                    </TableCell>
                    <TableCell sx={{ minWidth: 170 }}>
                      <Select
                        value={row.id_proyecto}
                        onChange={(event) => handleProjectChange(row.id, event.target.value)}
                        size="small"
                        fullWidth
                        displayEmpty
                      >
                        <MenuItem value="">Seleccione</MenuItem>
                        {projects.map((project) => (
                          <MenuItem key={project.id_proyecto} value={project.id_proyecto}>
                            {project.nombre_proyecto}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ minWidth: 190 }}>
                      <Select
                        value={row.id_subtarea}
                        onChange={(event) => handleSubTaskChange(row.id, event.target.value)}
                        size="small"
                        fullWidth
                        displayEmpty
                        disabled={!row.id_proyecto}
                      >
                        <MenuItem value="">Seleccione</MenuItem>
                        {subTasks.map((subTask) => (
                          <MenuItem key={subTask.id_subtarea} value={subTask.id_subtarea}>
                            {subTask.nombre_tarea}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <TextField
                        value={row.comentarios}
                        onChange={(event) => handleCommentChange(row.id, event.target.value)}
                        size="small"
                        placeholder="Notas adicionales..."
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Chip label="Pendiente" sx={pendienteChipSx} size="small" />
                    </TableCell>
                    {weekDays.map((day) => (
                      <TableCell key={day.iso} align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={row.horasPorDia[day.iso]}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                          }}
                          inputProps={{ min: 0, max: HORAS_MAXIMAS_DIA, step: 0.5 }}
                          onChange={(event) => handleHourChange(row.id, day.iso, event.target.value)}
                          sx={{ width: 108 }}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {rowTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7 + weekDays.length} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No hay filas que coincidan con los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Box
            sx={{
              minWidth: { xs: 220, md: 280 },
              px: 2,
              py: 1.25,
              borderRadius: 1,
              backgroundColor: '#f5f7f9',
              border: '1px solid #d6dee6',
              textAlign: 'right',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Total de Horas del Periodo
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#111111', fontSize: { xs: '1.2rem', md: '1.28rem' } }}>
              {totalHoras.toFixed(2)} hrs
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              bgcolor: '#1f4d2e',
              '&:hover': { bgcolor: '#173a23' },
            }}
          >
            Enviar a revisión
          </Button>
        </Stack>
      </Box>

      <Dialog open={successDialog.open} onClose={closeSuccessDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{successDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{successDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSuccessDialog} variant="contained" autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorDialog.open} onClose={closeErrorDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{errorDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeErrorDialog} variant="contained" autoFocus>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={logoutDialogOpen} onClose={handleCloseLogoutDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Sesión cerrada</DialogTitle>
        <DialogContent>
          <Typography>La sesión se cerró correctamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleCloseLogoutDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
