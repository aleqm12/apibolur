import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import RegistroHorasService from '../../services/RegistroHorasService';

const pendienteChipSx = {
  bgcolor: '#ffeb3b',
  color: '#4e342e',
  fontWeight: 700,
  border: '1px solid rgba(78, 52, 46, 0.25)',
};

const aprobadoChipSx = {
  bgcolor: '#d8f3dc',
  color: '#1b4332',
  fontWeight: 700,
  border: '1px solid rgba(27, 67, 50, 0.18)',
};

const rechazadoChipSx = {
  bgcolor: '#fde2e4',
  color: '#9d0208',
  fontWeight: 700,
  border: '1px solid rgba(157, 2, 8, 0.18)',
};

export function ActiveTimeSheet() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

  const currentWeekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), []);
  const currentWeekEnd = useMemo(() => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), []);

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
    const loadActiveSheet = async () => {
      if (!currentUser?.id_usuario) {
        return;
      }

      try {
        setIsLoading(true);
        // Consulta registros del usuario para la semana activa.
        const response = await RegistroHorasService.getByUser(currentUser.id_usuario);
        const registros = Array.isArray(response?.data) ? response.data : [];

        const activeRows = registros
          .filter((registro) => registro.fecha >= currentWeekStart && registro.fecha <= currentWeekEnd)
          .sort((a, b) => {
            if (a.fecha === b.fecha) {
              return Number(b.id_registro) - Number(a.id_registro);
            }
            return a.fecha < b.fecha ? 1 : -1;
          });

        setRows(activeRows);
      } catch {
        setErrorDialog({
          open: true,
          title: 'Error al cargar hoja',
          message: 'No fue posible cargar la hoja de tiempo activa.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveSheet();
  }, [currentUser, currentWeekStart, currentWeekEnd]);

  const totalHoras = useMemo(() => rows.reduce((acc, item) => acc + Number(item.horas || 0), 0), [rows]);
  // Calcula total de horas de la semana activa.

  if (!currentUser) {
    return null;
  }

  const fullName = `${currentUser.nombre || ''} ${currentUser.apellidos || ''}`.trim();

  const headerActionButtonSx = {
    color: 'secondary.contrastText',
    borderColor: 'secondary.contrastText',
    '&:hover': {
      borderColor: 'secondary.contrastText',
      backgroundColor: 'secondary.contrastText',
      color: 'secondary.main',
    },
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 6rem)', bgcolor: '#f4f6f8' }}>
      <Paper elevation={0} sx={{ px: { xs: 2, md: 4 }, py: 2, borderRadius: 0, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Hoja de Tiempo Activa</Typography>
            <Typography variant="body2">{fullName || currentUser.id_usuario} | Semana: {currentWeekStart} a {currentWeekEnd}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/registro-horas/crear')}>
              Editar hoja
            </Button>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/registro-horas/historial')}>
              Ver historial
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Resumen</Typography>
          <Typography variant="body1">Registros en semana activa: {rows.length}</Typography>
          <Typography variant="body1">Total horas registradas: {totalHoras.toFixed(2)}</Typography>
        </Paper>

        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 700, bgcolor: '#eef3f8' } }}>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Proyecto / Tarea</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Comentario</TableCell>
                <TableCell>Retroalimentacion Admin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Cargando hoja activa...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay registros en la semana activa.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const estadoRow = row.estado_aprobacion || 'Pendiente';
                  const chipSx = estadoRow === 'Aprobado'
                    ? aprobadoChipSx
                    : estadoRow === 'Rechazado'
                      ? rechazadoChipSx
                      : pendienteChipSx;

                  return (
                  <TableRow key={row.id_registro} hover>
                    <TableCell>{format(parseISO(row.fecha), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>[{row.id_proyecto}] {row.nombre_proyecto || row.id_proyecto} / {row.nombre_tarea || row.id_subtarea}</TableCell>
                    <TableCell align="right">{Number(row.horas || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        sx={chipSx}
                        label={estadoRow.toUpperCase()}
                      />
                    </TableCell>
                    <TableCell>{row.comentarios || '-'}</TableCell>
                    <TableCell>
                      {estadoRow === 'Rechazado'
                        ? row.motivo_rechazo_admin || 'Sin comentario del administrador.'
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={errorDialog.open} onClose={handleCloseErrorDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseErrorDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
