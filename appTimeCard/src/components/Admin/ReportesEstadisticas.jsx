import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import RegistroHorasService from '../../services/RegistroHorasService';
import ProjectService from '../../services/ProjectService';
import UserService from '../../services/UserService';

const PROJECT_BRAND_COLORS = ['#7A1E3A', '#B44D6C', '#63859E', '#4E6F87', '#A0627A'];
const WEEKLY_BRAND_COLORS = ['#7A1E3A', '#63859E', '#B44D6C', '#4E6F87'];
const GENDER_BRAND_COLORS = {
  Hombre: '#63859E',
  Mujer: '#7A1E3A',
  Otro: '#B44D6C',
  'No definido': '#4E6F87',
};

const getRowDate = (row) => {
  const rawDate = row?.fecha || row?.fecha_registro || row?.created_at || row?.updated_at || '';
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getYearWeek = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  const date = new Date(Date.UTC(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const normalizeGender = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (['m', 'masculino', 'hombre', 'male'].includes(normalized)) {
    return 'Hombre';
  }

  if (['f', 'femenino', 'mujer', 'female'].includes(normalized)) {
    return 'Mujer';
  }

  if (!normalized) {
    return 'No definido';
  }

  return 'Otro';
};

const getColorByIndex = (index, palette) => {
  if (!Array.isArray(palette) || palette.length === 0) {
    return '#63859E';
  }

  return palette[index % palette.length];
};

const escapeCsvField = (value) => {
  const normalized = String(value ?? '');
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
};

export function ReportesEstadisticas() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('Todos');

  useEffect(() => {
    const storedAuthUser = localStorage.getItem('authUser');

    if (!storedAuthUser) {
      navigate('/user/login');
      return;
    }

    try {
      const parsedAuthUser = JSON.parse(storedAuthUser);
      const isAdmin = String(parsedAuthUser?.id_rol) === '1' || parsedAuthUser?.nombre_rol === 'Administrador';

      if (!isAdmin) {
        navigate('/');
        return;
      }

      setCurrentUser(parsedAuthUser);
    } catch {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      navigate('/user/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [rowsResponse, usersResponse, projectsResponse] = await Promise.all([
          RegistroHorasService.getAll(),
          UserService.getUsers(),
          ProjectService.getProjects(),
        ]);

        setRows(Array.isArray(rowsResponse?.data) ? rowsResponse.data : []);
        setUsers(Array.isArray(usersResponse?.data) ? usersResponse.data : []);
        setProjects(Array.isArray(projectsResponse?.data) ? projectsResponse.data : []);
      } catch {
        setErrorDialog({
          open: true,
          title: 'Error al cargar reportes',
          message: 'No fue posible cargar la información para el módulo de reportes.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const fullName = `${currentUser?.nombre || ''} ${currentUser?.apellidos || ''}`.trim();

  const headerActionButtonSx = {
    color: 'secondary.contrastText',
    borderColor: 'secondary.contrastText',
    '&:hover': {
      borderColor: 'secondary.contrastText',
      backgroundColor: 'secondary.contrastText',
      color: 'secondary.main',
    },
  };

  const usersById = useMemo(() => {
    const mapped = new Map();

    users.forEach((userItem) => {
      if (userItem?.id_usuario) {
        mapped.set(String(userItem.id_usuario), userItem);
      }
    });

    return mapped;
  }, [users]);

  const projectOptions = useMemo(() => {
    const mapData = new Map();

    projects.forEach((projectItem) => {
      const id = String(projectItem?.id_proyecto || '').trim();
      if (!id) {
        return;
      }
      mapData.set(id, projectItem?.nombre_proyecto || id);
    });

    rows.forEach((row) => {
      const id = String(row?.id_proyecto || '').trim();
      if (!id || mapData.has(id)) {
        return;
      }
      mapData.set(id, row?.nombre_proyecto || id);
    });

    return [...mapData.entries()].map(([id, name]) => ({ id, name }));
  }, [projects, rows]);

  const filteredRows = useMemo(() => {
    const fromDate = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const toDate = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return rows.filter((row) => {
      const rowDate = getRowDate(row);
      const rowProject = String(row?.id_proyecto || '').trim();
      const rowEstado = String(row?.estado_aprobacion || 'Pendiente').trim();

      if (selectedProject && rowProject !== selectedProject) {
        return false;
      }

      if (selectedEstado !== 'Todos' && rowEstado !== selectedEstado) {
        return false;
      }

      if (fromDate && (!rowDate || rowDate < fromDate)) {
        return false;
      }

      if (toDate && (!rowDate || rowDate > toDate)) {
        return false;
      }

      return true;
    });
  }, [rows, startDate, endDate, selectedProject, selectedEstado]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set();
    const projectHours = new Map();
    const genderHours = new Map();
    const weekHours = new Map();

    let totalHours = 0;

    filteredRows.forEach((row) => {
      const hours = Number(row?.horas || 0) || 0;
      const userId = String(row?.id_usuario || row?.id_usuario_colaborador || '').trim();
      const projectId = String(row?.id_proyecto || 'SIN-PROYECTO').trim();
      const projectName = row?.nombre_proyecto || projectOptions.find((item) => item.id === projectId)?.name || projectId;
      const userGender = normalizeGender(usersById.get(userId)?.genero);
      const rowDate = getRowDate(row);
      const weekKey = getYearWeek(rowDate);

      totalHours += hours;

      if (userId) {
        uniqueUsers.add(userId);
      }

      projectHours.set(projectName, (projectHours.get(projectName) || 0) + hours);
      genderHours.set(userGender, (genderHours.get(userGender) || 0) + hours);

      if (weekKey) {
        weekHours.set(weekKey, (weekHours.get(weekKey) || 0) + hours);
      }
    });

    const topProjects = [...projectHours.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const genderDistribution = [...genderHours.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const weeklyHours = [...weekHours.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-8);

    return {
      totalHours,
      uniqueUsersCount: uniqueUsers.size,
      activeProjectsCount: projectHours.size,
      avgHoursPerUser: uniqueUsers.size > 0 ? totalHours / uniqueUsers.size : 0,
      topProjects,
      genderDistribution,
      weeklyHours,
    };
  }, [filteredRows, projectOptions, usersById]);

  const maxProjectHours = Math.max(...stats.topProjects.map((item) => item.value), 1);
  const maxWeeklyHours = Math.max(...stats.weeklyHours.map((item) => item.value), 1);
  const totalGenderHours = Math.max(stats.genderDistribution.reduce((acc, item) => acc + item.value, 0), 1);

  const handleExportCsv = () => {
    const header = [
      'Fecha',
      'ID Usuario',
      'Nombre Colaborador',
      'Genero',
      'ID Proyecto',
      'Proyecto',
      'Horas',
      'Estado',
    ];

    const records = filteredRows.map((row) => {
      const userId = String(row?.id_usuario || row?.id_usuario_colaborador || '').trim();
      const userInfo = usersById.get(userId);
      const fullUserName = `${userInfo?.nombre || row?.nombre || ''} ${userInfo?.apellidos || row?.apellidos || ''}`.trim();
      const projectId = String(row?.id_proyecto || '').trim();
      const projectName = row?.nombre_proyecto || projectOptions.find((item) => item.id === projectId)?.name || projectId;
      const rowDate = getRowDate(row);
      const formattedDate = rowDate ? rowDate.toISOString().slice(0, 10) : '';

      return [
        formattedDate,
        userId,
        fullUserName || '-',
        normalizeGender(userInfo?.genero),
        projectId,
        projectName,
        Number(row?.horas || 0).toFixed(2),
        String(row?.estado_aprobacion || 'Pendiente'),
      ];
    });

    const csvContent = [header, ...records]
      .map((line) => line.map(escapeCsvField).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);

    link.href = downloadUrl;
    link.setAttribute('download', `reportes_estadisticas_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 6rem)', bgcolor: '#f4f6f8' }}>
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
                Usuario: {fullName || currentUser?.id_usuario || 'Administrador'}
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
                Reportes y Estadísticas
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
              <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/admin/panel')}>
                Volver al Menú
              </Button>
              <Button
                variant="outlined"
                sx={headerActionButtonSx}
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  navigate('/user/login');
                }}
              >
                Cerrar Sesión
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              type="date"
              label="Desde"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              type="date"
              label="Hasta"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 230 }}>
              <InputLabel id="project-filter-label">Proyecto</InputLabel>
              <Select
                labelId="project-filter-label"
                value={selectedProject}
                label="Proyecto"
                onChange={(event) => setSelectedProject(event.target.value)}
              >
                <MenuItem value="">Todos los proyectos</MenuItem>
                {projectOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    [{item.id}] {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel id="estado-filter-label">Estado</InputLabel>
              <Select
                labelId="estado-filter-label"
                value={selectedEstado}
                label="Estado"
                onChange={(event) => setSelectedEstado(event.target.value)}
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Aprobado">Aprobado</MenuItem>
                <MenuItem value="Rechazado">Rechazado</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedProject('');
                setSelectedEstado('Todos');
              }}
            >
              Limpiar filtros
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportCsv}
              disabled={filteredRows.length === 0}
            >
              Exportar CSV
            </Button>
          </Stack>
        </Paper>

        {isLoading ? (
          <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <CircularProgress color="secondary" />
            <Typography sx={{ mt: 2 }}>Cargando métricas...</Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Horas Totales</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#7A1E3A' }}>{stats.totalHours.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Proyectos con Horas</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#63859E' }}>{stats.activeProjectsCount}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Colaboradores Activos</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#7A1E3A' }}>{stats.uniqueUsersCount}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Promedio Horas / Colaborador</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#63859E' }}>{stats.avgHoursPerUser.toFixed(2)}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Top 5 Proyectos por Horas
                  </Typography>
                  <Stack spacing={1.2}>
                    {stats.topProjects.length === 0 ? (
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        No hay datos para el filtro aplicado.
                      </Typography>
                    ) : (
                      stats.topProjects.map((item, index) => (
                        <Box key={item.name}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                            <Typography variant="body2">{item.value.toFixed(2)} h</Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={(item.value / maxProjectHours) * 100}
                            sx={{
                              height: 10,
                              borderRadius: 10,
                              bgcolor: 'rgba(99, 133, 158, 0.18)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getColorByIndex(index, PROJECT_BRAND_COLORS),
                              },
                            }}
                          />
                        </Box>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Distribución por Género (Horas)
                  </Typography>
                  <Stack spacing={1.2}>
                    {stats.genderDistribution.length === 0 ? (
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        No hay datos para el filtro aplicado.
                      </Typography>
                    ) : (
                      stats.genderDistribution.map((item) => {
                        const percent = (item.value / totalGenderHours) * 100;
                        const barColor = GENDER_BRAND_COLORS[item.name] || '#63859E';
                        return (
                          <Box key={item.name}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                              <Typography variant="body2">{percent.toFixed(1)}%</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              sx={{
                                height: 10,
                                borderRadius: 10,
                                bgcolor: 'rgba(122, 30, 58, 0.12)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: barColor,
                                },
                              }}
                            />
                          </Box>
                        );
                      })
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Tendencia Semanal de Horas (Últimas 8 semanas)
                  </Typography>
                  {stats.weeklyHours.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No hay datos para el filtro aplicado.
                    </Typography>
                  ) : (
                    <Grid container spacing={1.2}>
                      {stats.weeklyHours.map((item, index) => (
                        <Grid key={item.name} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.2,
                              textAlign: 'center',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: '#ffffff',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                              {item.name}
                            </Typography>
                            <Box
                              sx={{
                                mt: 0.7,
                                mb: 0.6,
                                mx: 'auto',
                                width: 24,
                                height: `${Math.max(20, (item.value / maxWeeklyHours) * 80)}px`,
                                borderRadius: 1,
                                bgcolor: getColorByIndex(index, WEEKLY_BRAND_COLORS),
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              {item.value.toFixed(1)} h
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      <Divider />

      <Dialog open={errorDialog.open} onClose={() => setErrorDialog({ open: false, title: '', message: '' })}>
        <DialogTitle>{errorDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog({ open: false, title: '', message: '' })} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
