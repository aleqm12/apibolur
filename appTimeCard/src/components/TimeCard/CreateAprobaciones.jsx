import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AprobacionesService from '../../services/AprobacionesService';

export function CreateAprobaciones() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterPersona, setFilterPersona] = useState('');
  const [filterProyecto, setFilterProyecto] = useState('');
  const [filterEstado, setFilterEstado] = useState('Pendiente');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

  const loadRows = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await AprobacionesService.getRegistros({
        estado: filterEstado,
        id_usuario: filterPersona,
        id_proyecto: filterProyecto,
      });
      const registros = Array.isArray(response?.data) ? response.data : [];
      setRows(registros);
      setSelectedIds([]);
    } catch {
      toast.error('No fue posible cargar los registros para aprobación.');
    } finally {
      setIsLoading(false);
    }
  }, [filterEstado, filterPersona, filterProyecto]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const personaOptions = useMemo(() => {
    const seen = new Set();
    return rows
      .filter((row) => {
        const key = `${row.id_usuario}|${row.nombre || ''}|${row.apellidos || ''}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((row) => ({
        id_usuario: row.id_usuario,
        nombre_completo: `${row.nombre || ''} ${row.apellidos || ''}`.trim(),
      }));
  }, [rows]);

  const proyectoOptions = useMemo(() => {
    const seen = new Set();
    return rows
      .filter((row) => {
        const key = `${row.id_proyecto}|${row.nombre_proyecto || ''}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((row) => ({
        id_proyecto: row.id_proyecto,
        nombre_proyecto: row.nombre_proyecto || row.id_proyecto,
      }));
  }, [rows]);

  const selectedRows = useMemo(() => {
    return rows.filter((row) => selectedIds.includes(row.id_registro));
  }, [rows, selectedIds]);

  const isAllSelected = rows.length > 0 && selectedIds.length === rows.length;

  const getChipColor = (estado) => {
    if (estado === 'Aprobado') {
      return 'success';
    }
    if (estado === 'Rechazado') {
      return 'error';
    }
    return 'warning';
  };

  const pendienteChipSx = {
    bgcolor: '#ffeb3b',
    color: '#4e342e',
    fontWeight: 700,
    border: '1px solid rgba(78, 52, 46, 0.25)',
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(rows.map((row) => row.id_registro));
      return;
    }
    setSelectedIds([]);
  };

  const toggleSelectRow = (rowId, checked) => {
    if (checked) {
      setSelectedIds((current) => [...new Set([...current, rowId])]);
      return;
    }
    setSelectedIds((current) => current.filter((id) => id !== rowId));
  };

  const submitDecision = async (estadoResultante, targetRows, motivoRechazo = '') => {
    if (!targetRows || targetRows.length === 0) {
      toast.error('Seleccione al menos un registro.');
      return;
    }

    if (estadoResultante === 'Rechazado' && motivoRechazo.trim() === '') {
      toast.error('Debe indicar un motivo de rechazo.');
      return;
    }

    try {
      const payload = {
        id_usuario: currentUser?.id_usuario || 'ADMIN',
        decisiones: targetRows.map((row) => ({
          id_registro: row.id_registro,
          estado_resultante: estadoResultante,
          motivo_rechazo: estadoResultante === 'Rechazado' ? motivoRechazo.trim() : null,
        })),
      };

      const response = await AprobacionesService.createAprobaciones(payload);
      const total = response?.data?.total_aprobaciones || 0;
      if (total > 0) {
        toast.success(`Se procesaron ${total} registro(s).`);
      } else {
        toast('No se realizaron cambios.');
      }

      if ((response?.data?.total_errores || 0) > 0) {
        toast.error('Algunas decisiones no se pudieron guardar. Revise el servidor.');
      }

      setRejectDialogOpen(false);
      setRejectReason('');
      await loadRows();
    } catch {
      toast.error('No fue posible guardar la aprobación.');
    }
  };

  const handleApproveSelected = async () => {
    await submitDecision('Aprobado', selectedRows);
  };

  const handleRejectSelected = () => {
    if (selectedRows.length === 0) {
      toast.error('Seleccione al menos un registro.');
      return;
    }
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    await submitDecision('Rechazado', selectedRows, rejectReason);
  };

  const handleSingleDecision = async (row, estadoResultante) => {
    if (estadoResultante === 'Rechazado') {
      setSelectedIds([row.id_registro]);
      setRejectDialogOpen(true);
      return;
    }
    await submitDecision(estadoResultante, [row]);
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

  const fullName = `${currentUser?.nombre || ''} ${currentUser?.apellidos || ''}`.trim();
  const userInitials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0].toUpperCase())
    .join('') || 'AD';

  const headerActionButtonSx = {
    color: 'secondary.contrastText',
    borderColor: 'secondary.contrastText',
    '&:hover': {
      borderColor: 'secondary.contrastText',
      backgroundColor: 'secondary.contrastText',
      color: 'secondary.main',
    },
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 6rem)', bgcolor: '#f4f6f8' }}>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          borderRadius: 0,
          bgcolor: 'secondary.main',
          color: 'secondary.contrastText',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.16)',
                border: '1px solid rgba(255, 255, 255, 0.42)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'secondary.contrastText',
              }}
            >
              {userInitials}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Panel de Administracion
              </Typography>
              <Typography variant="body1">Aprobacion de tiempos</Typography>
              <Typography variant="body2" sx={{ opacity: 0.88 }}>
                Usuario: {fullName || currentUser?.id_usuario || 'Administrador'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/admin/panel')}>
              Volver al menu
            </Button>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={handleLogout}>
              Cerrar sesion
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 0, px: { xs: 2, md: 3 }, py: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Filtrar por:
          </Typography>
          <Select value={filterPersona} onChange={(event) => setFilterPersona(event.target.value)} size="small" displayEmpty sx={{ minWidth: 220 }}>
            <MenuItem value="">Persona</MenuItem>
            {personaOptions.map((option) => (
              <MenuItem key={option.id_usuario} value={option.id_usuario}>
                [{option.id_usuario}] {option.nombre_completo || 'Sin nombre'}
              </MenuItem>
            ))}
          </Select>
          <Select value={filterProyecto} onChange={(event) => setFilterProyecto(event.target.value)} size="small" displayEmpty sx={{ minWidth: 220 }}>
            <MenuItem value="">Proyecto</MenuItem>
            {proyectoOptions.map((option) => (
              <MenuItem key={option.id_proyecto} value={option.id_proyecto}>
                [{option.id_proyecto}] {option.nombre_proyecto}
              </MenuItem>
            ))}
          </Select>
          <Select value={filterEstado} onChange={(event) => setFilterEstado(event.target.value)} size="small" sx={{ minWidth: 220 }}>
            <MenuItem value="Pendiente">Estado: Pendiente</MenuItem>
            <MenuItem value="Aprobado">Estado: Aprobado</MenuItem>
            <MenuItem value="Rechazado">Estado: Rechazado</MenuItem>
            <MenuItem value="Todos">Estado: Todos</MenuItem>
          </Select>
          <Button variant="outlined" onClick={() => {
            setFilterPersona('');
            setFilterProyecto('');
            setFilterEstado('Pendiente');
          }}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      <Divider />

      <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 800, bgcolor: '#eef3f8' } }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox checked={isAllSelected} onChange={(event) => toggleSelectAll(event.target.checked)} />
                </TableCell>
                <TableCell>COLABORADOR</TableCell>
                <TableCell>PROYECTO / TAREA</TableCell>
                <TableCell align="center">HRS</TableCell>
                <TableCell align="center">ESTADO</TableCell>
                <TableCell align="center">ACCION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Cargando registros...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay registros para mostrar con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isSelected = selectedIds.includes(row.id_registro);
                  return (
                    <TableRow key={row.id_registro} hover>
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} onChange={(event) => toggleSelectRow(row.id_registro, event.target.checked)} />
                      </TableCell>
                      <TableCell>
                        [{row.id_usuario}] {(row.nombre || '').trim()} {(row.apellidos || '').trim()}
                      </TableCell>
                      <TableCell>
                        [{row.id_proyecto}] {row.nombre_proyecto || row.id_proyecto} / {row.nombre_tarea || row.id_subtarea}
                      </TableCell>
                      <TableCell align="center">{Number(row.horas || 0).toFixed(1)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={(row.estado_aprobacion || 'Pendiente').toUpperCase()}
                          color={row.estado_aprobacion === 'Pendiente' ? 'default' : getChipColor(row.estado_aprobacion)}
                          sx={row.estado_aprobacion === 'Pendiente' ? pendienteChipSx : undefined}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button size="small" variant="outlined" color="success" onClick={() => handleSingleDecision(row, 'Aprobado')}>
                            A
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleSingleDecision(row, 'Rechazado')}>
                            R
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            [{selectedIds.length} registros seleccionados]
          </Typography>
          <Button variant="contained" color="error" onClick={handleRejectSelected} disabled={selectedIds.length === 0}>
            Rechazar
          </Button>
          <Button variant="contained" onClick={handleApproveSelected} disabled={selectedIds.length === 0}>
            Aprobar seleccionados
          </Button>
        </Stack>
      </Box>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Rechazar registros seleccionados</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Indique el motivo del rechazo para {selectedRows.length} registro(s).
          </Typography>
          <TextField
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            multiline
            minRows={4}
            fullWidth
            label="Motivo del rechazo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmReject}>
            Confirmar rechazo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={logoutDialogOpen} onClose={handleCloseLogoutDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Sesion cerrada</DialogTitle>
        <DialogContent>
          <Typography>La sesion se cerro correctamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseLogoutDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
