import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid2';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useNavigate } from 'react-router-dom';
import AprobacionesService from '../../services/AprobacionesService';
import GrammarSuggestionService from '../../services/GrammarSuggestionService';

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

export function HistorialAprobaciones() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterProyecto, setFilterProyecto] = useState('');
  const [filterDecisor, setFilterDecisor] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCheckingEditText, setIsCheckingEditText] = useState(false);
  const [editSuggestions, setEditSuggestions] = useState([]);
  const [editDialog, setEditDialog] = useState({
    open: false,
    idAprobacion: null,
    estadoResultante: '',
    motivoRechazo: '',
  });
  const [errorDialog, setErrorDialog] = useState({ open: false, title: '', message: '' });

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
          fecha_desde: filterFechaDesde,
          fecha_hasta: filterFechaHasta,
        });
        setRows(Array.isArray(response?.data) ? response.data : []);
      } catch {
        setErrorDialog({
          open: true,
          title: 'Error al cargar historial',
          message: 'No fue posible cargar el historial de aprobaciones.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [currentUser, filterEstado, filterProyecto, filterDecisor, filterFechaDesde, filterFechaHasta]);

  const proyectoOptions = useMemo(() => {
    const unique = new Map();
    rows.forEach((row) => {
      unique.set(row.id_proyecto, row.nombre_proyecto || row.id_proyecto);
    });
    return [...unique.entries()].map(([id, name]) => ({ id, name }));
  }, [rows]);

  const decisorOptions = useMemo(() => {
    const uniqueMap = new Map();

    rows.forEach((row) => {
      const decisorId = row.id_usuario_decisor;
      if (!decisorId || uniqueMap.has(decisorId)) {
        return;
      }

      const decisorNombre = `${row.nombre_decisor || ''} ${row.apellidos_decisor || ''}`.trim();
      uniqueMap.set(decisorId, decisorNombre || decisorId);
    });

    return [...uniqueMap.entries()].map(([id, nombre]) => ({ id, nombre }));
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

  const handleCloseErrorDialog = () => {
    setErrorDialog({ open: false, title: '', message: '' });
  };

  useEffect(() => {
    if (!editDialog.open) {
      return;
    }

    const normalizedText = (editDialog.motivoRechazo || '').trim();
    if (normalizedText.length < 8) {
      setEditSuggestions([]);
      setIsCheckingEditText(false);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsCheckingEditText(true);
      const suggestions = await GrammarSuggestionService.checkText(normalizedText, 'es');
      setEditSuggestions(suggestions);
      setIsCheckingEditText(false);
    }, 700);

    return () => clearTimeout(timerId);
  }, [editDialog.open, editDialog.motivoRechazo]);

  const handleOpenEditDialog = (row) => {
    setEditDialog({
      open: true,
      idAprobacion: row.id_aprobacion,
      estadoResultante: row.estado_resultante || '',
      motivoRechazo: row.motivo_rechazo || '',
    });
    setEditSuggestions([]);
    setIsCheckingEditText(false);
  };

  const handleCloseEditDialog = () => {
    setEditDialog({
      open: false,
      idAprobacion: null,
      estadoResultante: '',
      motivoRechazo: '',
    });
    setEditSuggestions([]);
    setIsCheckingEditText(false);
    setIsSavingEdit(false);
  };

  const handleApplyEditSuggestion = (suggestion) => {
    setEditDialog((current) => ({
      ...current,
      motivoRechazo: GrammarSuggestionService.applySuggestion(current.motivoRechazo, suggestion),
    }));
  };

  const handleSaveEditedReason = async () => {
    const idAprobacion = Number(editDialog.idAprobacion || 0);
    if (idAprobacion <= 0) {
      setErrorDialog({
        open: true,
        title: 'No se pudo guardar',
        message: 'No se encontró la aprobación a editar.',
      });
      return;
    }

    const normalizedReason = (editDialog.motivoRechazo || '').trim();
    if (editDialog.estadoResultante === 'Rechazado' && normalizedReason === '') {
      setErrorDialog({
        open: true,
        title: 'Motivo requerido',
        message: 'El motivo de rechazo no puede quedar vacío.',
      });
      return;
    }

    try {
      setIsSavingEdit(true);
      const response = await AprobacionesService.updateAprobacion({
        id_aprobacion: idAprobacion,
        motivo_rechazo: normalizedReason,
      });

      const updatedReason = response?.data?.motivo_rechazo ?? normalizedReason;

      setRows((currentRows) => currentRows.map((row) => (
        row.id_aprobacion === idAprobacion
          ? { ...row, motivo_rechazo: updatedReason }
          : row
      )));
      handleCloseEditDialog();
    } catch {
      setErrorDialog({
        open: true,
        title: 'No se pudo actualizar',
        message: 'Ocurrió un error al actualizar el texto del historial.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fullName = `${currentUser?.nombre || ''} ${currentUser?.apellidos || ''}`.trim();

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
                Historial de Aprobaciones
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
              <Button variant="outlined" sx={headerActionButtonSx} onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

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
              <MenuItem value="">Administrador: Todos</MenuItem>
              {decisorOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>
              ))}
            </Select>

            <TextField
              size="small"
              type="date"
              label="Desde"
              value={filterFechaDesde}
              onChange={(event) => setFilterFechaDesde(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              type="date"
              label="Hasta"
              value={filterFechaHasta}
              onChange={(event) => setFilterFechaHasta(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Button variant="outlined" onClick={() => {
              setFilterEstado('Todos');
              setFilterProyecto('');
              setFilterDecisor('');
              setFilterFechaDesde('');
              setFilterFechaHasta('');
            }}>
              Limpiar Filtros
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
                <TableCell>Administrador</TableCell>
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
                      <Chip
                        size="small"
                        sx={row.estado_resultante === 'Aprobado' ? aprobadoChipSx : rechazadoChipSx}
                        label={(row.estado_resultante || '').toUpperCase()}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1} alignItems="flex-start">
                        <Typography variant="body2">{row.motivo_rechazo || '-'}</Typography>
                        {row.estado_resultante === 'Rechazado' ? (
                          <Button size="small" variant="outlined" onClick={() => handleOpenEditDialog(row)}>
                            Editar texto
                          </Button>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{`${row.nombre_decisor || ''} ${row.apellidos_decisor || ''}`.trim() || row.id_usuario_decisor}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Editar motivo de rechazo</DialogTitle>
        <DialogContent>
          <TextField
            value={editDialog.motivoRechazo}
            onChange={(event) => setEditDialog((current) => ({ ...current, motivoRechazo: event.target.value }))}
            multiline
            minRows={4}
            fullWidth
            label="Motivo del rechazo"
            helperText={
              isCheckingEditText
                ? 'Revisando ortografía y redacción...'
                : editSuggestions.length > 0
                  ? editSuggestions[0].replacement
                    ? `Sugerencia: cambiar "${editSuggestions[0].original}" por "${editSuggestions[0].replacement}".`
                    : `Sugerencia: ${editSuggestions[0].message}`
                  : ' '
            }
            sx={{ mt: 1 }}
          />

          {editSuggestions.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {editSuggestions.map((suggestion, index) => (
                <Button
                  key={`${suggestion.offset}-${index}`}
                  size="small"
                  variant="outlined"
                  onClick={() => handleApplyEditSuggestion(suggestion)}
                  disabled={!suggestion.replacement}
                >
                  {suggestion.replacement ? `Aplicar: ${suggestion.replacement}` : 'Ver sugerencia'}
                </Button>
              ))}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSavingEdit}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveEditedReason} disabled={isSavingEdit}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

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
