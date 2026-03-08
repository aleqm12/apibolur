import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RegistroHorasService from '../../services/RegistroHorasService';

const getChipColor = (estado) => {
  if (estado === 'Aprobado') {
    return 'success';
  }
  if (estado === 'Rechazado') {
    return 'error';
  }
  return 'warning';
};

export function HistorialHojasTiempo() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allRows, setAllRows] = useState([]);
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');

  useEffect(() => {
    const storedAuthUser = localStorage.getItem('authUser');

    if (!storedAuthUser) {
      navigate('/user/login');
      return;
    }

    try {
      const parsedAuthUser = JSON.parse(storedAuthUser);
      setCurrentUser(parsedAuthUser);
    } catch {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      navigate('/user/login');
    }
  }, [navigate]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentUser?.id_usuario) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await RegistroHorasService.getByUser(currentUser.id_usuario);
        const registros = Array.isArray(response?.data) ? response.data : [];

        const orderedRows = [...registros].sort((a, b) => {
          if (a.fecha === b.fecha) {
            return Number(b.id_registro) - Number(a.id_registro);
          }
          return a.fecha < b.fecha ? 1 : -1;
        });

        setAllRows(orderedRows);
      } catch {
        toast.error('No fue posible cargar el historial de hojas de tiempo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [currentUser]);

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      const estadoOk = filterEstado === 'Todos' || row.estado_aprobacion === filterEstado;
      const desdeOk = filterDesde === '' || row.fecha >= filterDesde;
      const hastaOk = filterHasta === '' || row.fecha <= filterHasta;
      return estadoOk && desdeOk && hastaOk;
    });
  }, [allRows, filterEstado, filterDesde, filterHasta]);

  const totalHoras = useMemo(() => rows.reduce((acc, item) => acc + Number(item.horas || 0), 0), [rows]);

  if (!currentUser) {
    return null;
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 6rem)', bgcolor: '#f4f6f8' }}>
      <Paper elevation={0} sx={{ px: { xs: 2, md: 4 }, py: 2, borderRadius: 0, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Historial de Hojas de Tiempo</Typography>
            <Typography variant="body2">Filtre por estado y rango de fechas para revisar decisiones.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" sx={{ color: 'secondary.contrastText', borderColor: 'secondary.contrastText' }} onClick={() => navigate('/registro-horas/activa')}>
              Hoja activa
            </Button>
            <Button variant="outlined" sx={{ color: 'secondary.contrastText', borderColor: 'secondary.contrastText' }} onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Select size="small" value={filterEstado} onChange={(event) => setFilterEstado(event.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="Todos">Estado: Todos</MenuItem>
              <MenuItem value="Pendiente">Estado: Pendiente</MenuItem>
              <MenuItem value="Aprobado">Estado: Aprobado</MenuItem>
              <MenuItem value="Rechazado">Estado: Rechazado</MenuItem>
            </Select>
            <TextField size="small" type="date" label="Desde" value={filterDesde} onChange={(event) => setFilterDesde(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="Hasta" value={filterHasta} onChange={(event) => setFilterHasta(event.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="outlined" onClick={() => {
              setFilterEstado('Todos');
              setFilterDesde('');
              setFilterHasta('');
            }}>
              Limpiar
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>Total registros: {rows.length} | Horas acumuladas: {totalHoras.toFixed(2)}</Typography>
        </Paper>

        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 700, bgcolor: '#eef3f8' } }}>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proyecto / Tarea</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Comentarios</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Cargando historial...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No hay datos con los filtros actuales.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id_registro} hover>
                    <TableCell>{row.fecha}</TableCell>
                    <TableCell>[{row.id_proyecto}] {row.nombre_proyecto || row.id_proyecto} / {row.nombre_tarea || row.id_subtarea}</TableCell>
                    <TableCell align="right">{Number(row.horas || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" color={getChipColor(row.estado_aprobacion)} label={(row.estado_aprobacion || 'Pendiente').toUpperCase()} />
                    </TableCell>
                    <TableCell>{row.comentarios || '-'}</TableCell>
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
