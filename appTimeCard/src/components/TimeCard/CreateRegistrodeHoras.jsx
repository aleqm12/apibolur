import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
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
import toast from 'react-hot-toast';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import ProjectService from '../../services/ProjectService';
import RegistroHorasService from '../../services/RegistroHorasService';

const ESTADOS = ['Pendiente', 'Aprobado', 'Rechazado'];
const HORAS_MAXIMAS_DIA = 24;
const CANTIDAD_DIAS = 7;

const getTodayIso = () => format(new Date(), 'yyyy-MM-dd');

const buildWeekDays = (periodStart) => {
  const startDate = parseISO(periodStart);
  return Array.from({ length: CANTIDAD_DIAS }, (_, index) => {
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

const normalizeHourValue = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return '';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return '';
  }

  return numericValue > HORAS_MAXIMAS_DIA ? HORAS_MAXIMAS_DIA : numericValue;
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
  color: '#1f2937',
  fontWeight: 700,
};

const getEstadoChipColor = (estado) => {
  if (estado === 'Aprobado') {
    return 'success';
  }

  if (estado === 'Rechazado') {
    return 'error';
  }

  return 'default';
};

const getEstadoChipSx = (estado) => {
  return estado === 'Pendiente' ? pendienteChipSx : undefined;
};

export function CreateRegistrodeHoras() {
  const navigate = useNavigate();
  const idUsuario = '115130776';
  const [periodStart, setPeriodStart] = useState(getTodayIso());
  const [projects, setProjects] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState(() => [buildEmptyRow(buildWeekDays(getTodayIso()))]);

  const weekDays = useMemo(() => buildWeekDays(periodStart), [periodStart]);

  useEffect(() => {
    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        horasPorDia: buildHoursByWeek(weekDays, row.horasPorDia),
      }))
    );
  }, [weekDays]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await ProjectService.getProjects();
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch {
        toast.error('No fue posible cargar proyectos y sub-tareas.');
      }
    };

    loadProjects();
  }, []);

  const projectMap = useMemo(() => {
    return projects.reduce((accumulator, project) => {
      accumulator[project.id_proyecto] = project;
      return accumulator;
    }, {});
  }, [projects]);

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

  const handleStatusChange = (rowId, estadoAprobacion) => {
    updateRow(rowId, (currentRow) => ({
      ...currentRow,
      estado_aprobacion: estadoAprobacion,
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

  const totalHoras = useMemo(() => {
    return rows.reduce((accumulator, row) => accumulator + sumHours(row.horasPorDia), 0);
  }, [rows]);

  const parseRowsToPayload = () => {
    const validationErrors = [];

    const registros = rows.flatMap((row, rowIndex) => {
      const horasFila = sumHours(row.horasPorDia);

      if (horasFila === 0) {
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

          return {
            id_usuario: idUsuario.trim(),
            id_subtarea: row.id_subtarea,
            fecha: day.iso,
            horas: Number(horas.toFixed(2)),
            comentarios: row.comentarios?.trim() ? row.comentarios.trim() : null,
            estado_aprobacion: row.estado_aprobacion,
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
      toast.error(validationErrors[0]);
      return;
    }

    if (registros.length === 0) {
      toast.error('Debe ingresar al menos una cantidad de horas para guardar.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await RegistroHorasService.createBatch({ registros });
      const totalInsertados = response?.data?.total_insertados || 0;
      const totalErrores = response?.data?.total_errores || 0;

      if (totalInsertados > 0 && totalErrores === 0) {
        toast.success(`Se guardaron ${totalInsertados} registros de horas.`);
      } else if (totalInsertados > 0 && totalErrores > 0) {
        toast.success(`Se guardaron ${totalInsertados} registros y ${totalErrores} quedaron con error.`);
      } else {
        toast.error('No se logró guardar ningún registro.');
      }

      setRows([buildEmptyRow(weekDays)]);
      setSelectedRowIds([]);
    } catch {
      toast.error('No fue posible guardar la hoja de tiempo.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedEndDate = format(addDays(parseISO(periodStart), CANTIDAD_DIAS - 1), 'dd/MM/yyyy');
  const formattedStartDate = format(parseISO(periodStart), 'dd/MM/yyyy');

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
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
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Hoja de tiempo
            </Typography>
            <Typography variant="body1">Alejandro Quesada</Typography>
            <Typography variant="body2">ID: {idUsuario || 'sin definir'}</Typography>
          </Box>
          <Button variant="outlined" sx={{ color: '#ecf6ff', borderColor: '#ecf6ff' }} onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 0 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="Inicio periodo"
            type="date"
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Periodo: {formattedStartDate} a {formattedEndDate}
          </Typography>
          <Chip label="Pendiente de envío" sx={pendienteChipSx} />
        </Stack>
      </Paper>

      <Divider />

      <Box sx={{ px: { xs: 1, md: 2 }, pb: 4 }}>
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
            <TableHead sx={{ bgcolor: '#eef3f8' }}>
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
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const selectedProject = projectMap[row.id_proyecto];
                const subTasks = getSubTasksByProject(row.id_proyecto);
                const rowTotal = sumHours(row.horasPorDia);

                return (
                  <TableRow key={row.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRowIds.includes(row.id)}
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
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Select
                        value={row.estado_aprobacion}
                        onChange={(event) => handleStatusChange(row.id, event.target.value)}
                        size="small"
                        fullWidth
                      >
                        {ESTADOS.map((estado) => (
                          <MenuItem key={estado} value={estado}>
                            <Chip label={estado} color={getEstadoChipColor(estado)} sx={getEstadoChipSx(estado)} size="small" />
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    {weekDays.map((day) => (
                      <TableCell key={day.iso} align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={row.horasPorDia[day.iso]}
                          inputProps={{ min: 0, max: HORAS_MAXIMAS_DIA, step: 0.25 }}
                          onChange={(event) => handleHourChange(row.id, day.iso, event.target.value)}
                          sx={{ width: 78 }}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {rowTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="h6">Total: {totalHoras.toFixed(2)} h</Typography>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={isSaving}>
            Enviar a revisión
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
