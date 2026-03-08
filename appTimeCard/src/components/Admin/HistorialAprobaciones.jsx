import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AprobacionesService from '../../services/AprobacionesService';

const getChipColor = (estado) => {
  if (estado === 'Aprobado') {
    return 'success';
  }
  return 'error';
};

export function HistorialAprobaciones() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterProyecto, setFilterProyecto] = useState('');
  const [filterDecisor, setFilterDecisor] = useState('');

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
    const loadHistory = async () => {
      if (!currentUser) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await AprobacionesService.getHistorial({
          estado_resultante: filterEstado,
          id_proyecto: filterProyecto,
          id_usuario: filterDecisor,
        });
        setRows(Array.isArray(response?.data) ? response.data : []);
      } catch {
        toast.error('No fue posible cargar el historial de aprobaciones.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [currentUser, filterEstado, filterProyecto, filterDecisor]);

  const proyectoOptions = useMemo(() => {
    const unique = new Map();
    rows.forEach((row) => {
      unique.set(row.id_proyecto, row.nombre_proyecto || row.id_proyecto);
    });
    return [...unique.entries()].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const decisorOptions = useMemo(() => {
    const unique = new Set(rows.map((row) => row.id_usuario_decisor).filter(Boolean));
    return [...unique];
  }, [rows]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/user/login');
  };

  const headerActionButtonSx = {
    color: 'secondary.contrastText',
    borderColor: 'secondary.contrastText',
    '&:hover': {
      borderColor: 'secondary.contrastText',
      backgroundColor: 'secondary.contrastText',
      color: 'secondary.main',
    },
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 6rem)', bgcolor: '#f4f6f8' }}>
      <Paper elevation={0} sx={{ px: { xs: 2, md: 4 }, py: 2, borderRadius: 0, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Historial de Aprobaciones</Typography>
            <Typography variant="body2">Auditoria de decisiones de aprobacion y rechazo.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/admin/panel')}>
              Volver al panel
            </Button>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Select size="small" value={filterEstado} onChange={(event) => setFilterEstado(event.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="Todos">Estado: Todos</MenuItem>
              <MenuItem value="Aprobado">Estado: Aprobado</MenuItem>
              <MenuItem value="Rechazado">Estado: Rechazado</MenuItem>
            </Select>

            <Select size="small" value={filterProyecto} displayEmpty onChange={(event) => setFilterProyecto(event.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="">Proyecto: Todos</MenuItem>
              {proyectoOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>[{item.id}] {item.name}</MenuItem>
              ))}
            </Select>

            <Select size="small" value={filterDecisor} displayEmpty onChange={(event) => setFilterDecisor(event.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="">Decisor: Todos</MenuItem>
              {decisorOptions.map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </Select>

            <Button variant="outlined" onClick={() => {
              setFilterEstado('Todos');
              setFilterProyecto('');
              setFilterDecisor('');
            }}>
              Limpiar
            </Button>
          </Stack>
        </Paper>

        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 700, bgcolor: '#eef3f8' } }}>
              <TableRow>
                <TableCell>Fecha decision</TableCell>
                <TableCell>Colaborador</TableCell>
                <TableCell>Proyecto / Tarea</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="center">Resultado</TableCell>
                <TableCell>Motivo rechazo</TableCell>
                <TableCell>Usuario decisor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Cargando historial...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay decisiones registradas para los filtros seleccionados. Este historial se llena cuando un administrador aprueba o rechaza registros.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id_aprobacion} hover>
                    <TableCell>{row.fecha_decision}</TableCell>
                    <TableCell>[{row.id_usuario_colaborador}] {(row.nombre || '').trim()} {(row.apellidos || '').trim()}</TableCell>
                    <TableCell>[{row.id_proyecto}] {row.nombre_proyecto || row.id_proyecto} / {row.nombre_tarea || '-'}</TableCell>
                    <TableCell align="right">{Number(row.horas || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" color={getChipColor(row.estado_resultante)} label={(row.estado_resultante || '').toUpperCase()} />
                    </TableCell>
                    <TableCell>{row.motivo_rechazo || '-'}</TableCell>
                    <TableCell>{row.id_usuario_decisor}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
