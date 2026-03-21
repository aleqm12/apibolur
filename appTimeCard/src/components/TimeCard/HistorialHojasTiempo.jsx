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
import Tooltip from '@mui/material/Tooltip';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import RegistroHorasService from '../../services/RegistroHorasService';

const DRAFT_STORAGE_PREFIX = 'timeSheetDraft';

const pendienteChipSx = {
  bgcolor: '#ffeb3b',
  color: '#4e342e',
  fontWeight: 700,
  border: '1px solid rgba(78, 52, 46, 0.25)',
};

const enviadoChipSx = {
  bgcolor: '#d8f3dc',
  color: '#1b4332',
  fontWeight: 700,
  border: '1px solid rgba(27, 67, 50, 0.18)',
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

export function HistorialHojasTiempo() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allRows, setAllRows] = useState([]);
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [selectedSheetKey, setSelectedSheetKey] = useState('');
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, title: '', text: '' });
  const [errorDialog, setErrorDialog] = useState({ open: false, title: '', message: '' });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, sheetKey: '', periodStart: '', periodEnd: '' });

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
        // Carga el historial de registros del colaborador autenticado.
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
        setErrorDialog({
          open: true,
          title: 'Error al cargar historial',
          message: 'No fue posible cargar el historial de hojas de tiempo.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [currentUser]);

  const sheets = useMemo(() => {
    // Consolida registros por semana para vista histórica de hojas de tiempo.
    const filteredRows = allRows.filter((row) => {
      const estadoOk = filterEstado === 'Todos' || row.estado_aprobacion === filterEstado;
      const desdeOk = filterDesde === '' || row.fecha >= filterDesde;
      const hastaOk = filterHasta === '' || row.fecha <= filterHasta;
      return estadoOk && desdeOk && hastaOk;
    });

    const grouped = filteredRows.reduce((accumulator, row) => {
      const currentDate = parseISO(row.fecha);
      const periodStart = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const periodEnd = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const key = `${periodStart}|${periodEnd}`;

      if (!accumulator[key]) {
        accumulator[key] = {
          key,
          periodStart,
          periodEnd,
          totalRegistros: 0,
          totalHoras: 0,
          horasAprobadas: 0,
          horasPendientes: 0,
          horasRechazadas: 0,
          estados: new Set(),
          feedbacks: new Set(),
        };
      }

      const horasRow = Number(row.horas || 0);
      accumulator[key].totalRegistros += 1;
      accumulator[key].totalHoras += horasRow;
      accumulator[key].estados.add(row.estado_aprobacion || 'Pendiente');

      if ((row.estado_aprobacion || 'Pendiente') === 'Aprobado') {
        accumulator[key].horasAprobadas += horasRow;
      } else if ((row.estado_aprobacion || 'Pendiente') === 'Rechazado') {
        accumulator[key].horasRechazadas += horasRow;
      } else {
        accumulator[key].horasPendientes += horasRow;
      }

      if ((row.estado_aprobacion || '') === 'Rechazado' && row.motivo_rechazo_admin) {
        accumulator[key].feedbacks.add(row.motivo_rechazo_admin);
      }

      return accumulator;
    }, {});

    const dbSheets = Object.values(grouped)
      .map((sheet) => {
        const estados = [...sheet.estados];
        let estadoHoja = 'Pendiente';

        if (sheet.horasAprobadas > 0 && (sheet.horasPendientes > 0 || sheet.horasRechazadas > 0)) {
          estadoHoja = 'Parcial';
        } else if (estados.includes('Rechazado')) {
          estadoHoja = 'Rechazado';
        } else if (estados.includes('Pendiente')) {
          estadoHoja = 'Pendiente';
        } else if (estados.includes('Aprobado')) {
          estadoHoja = 'Aprobado';
        }

        return {
          ...sheet,
          estadoHoja,
          estadoEnvio: 'Enviado',
          feedbackResumen: [...sheet.feedbacks].join(' | ') || '-',
          source: 'db',
        };
      })
      .sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1));

    const draftSheets = [];
    const userId = currentUser?.id_usuario;

    if (userId) {
      const prefix = `${DRAFT_STORAGE_PREFIX}:${userId}:`;

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(prefix)) {
          continue;
        }

        const draftRaw = localStorage.getItem(key);
        if (!draftRaw) {
          continue;
        }

        try {
          const draft = JSON.parse(draftRaw);
          const periodStart = draft?.period_start || key.split(':')[2] || '';
          const periodEnd = draft?.period_end || key.split(':')[3] || '';

          if (!periodStart || !periodEnd) {
            continue;
          }

          const rows = Array.isArray(draft?.rows) ? draft.rows : [];
          let totalHorasDraft = 0;

          rows.forEach((row) => {
            const horasPorDia = row?.horasPorDia || {};
            Object.values(horasPorDia).forEach((value) => {
              const hours = Number(value);
              if (Number.isFinite(hours) && hours > 0) {
                totalHorasDraft += hours;
              }
            });
          });

          const totalRegistrosDraft = rows.length;
          const desdeOk = filterDesde === '' || periodStart >= filterDesde;
          const hastaOk = filterHasta === '' || periodEnd <= filterHasta;
          const estadoOk = filterEstado === 'Todos' || filterEstado === 'Pendiente';

          if (!desdeOk || !hastaOk || !estadoOk) {
            continue;
          }

          draftSheets.push({
            key: `${periodStart}|${periodEnd}`,
            periodStart,
            periodEnd,
            totalRegistros: totalRegistrosDraft,
            totalHoras: totalHorasDraft,
            estadoHoja: 'Pendiente',
            estadoEnvio: 'Pendiente de envio',
            feedbackResumen: '-',
            source: 'draft',
          });
        } catch {
          // Ignora borradores mal formados.
        }
      }
    }

    const sheetMap = new Map();
    dbSheets.forEach((sheet) => {
      sheetMap.set(sheet.key, sheet);
    });

    draftSheets.forEach((sheet) => {
      if (!sheetMap.has(sheet.key)) {
        sheetMap.set(sheet.key, sheet);
      }
    });

    return [...sheetMap.values()].sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1));
  }, [allRows, filterEstado, filterDesde, filterHasta, currentUser]);

  const totalHoras = useMemo(() => sheets.reduce((acc, item) => acc + Number(item.totalHoras || 0), 0), [sheets]);

  const handleOpenSelectedSheet = (viewMode = false) => {
    if (!selectedSheetKey) {
      setErrorDialog({
        open: true,
        title: 'Seleccione una hoja',
        message: 'Seleccione una hoja para continuar.',
      });
      return;
    }

    const selectedSheet = sheets.find((item) => item.key === selectedSheetKey);
    if (!selectedSheet) {
      setErrorDialog({
        open: true,
        title: 'Hoja no disponible',
        message: 'La hoja seleccionada ya no esta disponible.',
      });
      return;
    }

    let modoDestino = selectedSheet.source === 'draft' ? 'draft' : 'editar';
    if (viewMode) {
      modoDestino = selectedSheet.source === 'draft' ? 'ver-borrador' : 'ver';
    }
    navigate(`/registro-horas/crear?modo=${modoDestino}&inicio=${selectedSheet.periodStart}&fin=${selectedSheet.periodEnd}`);
  };

  const handleOpenFeedbackDialog = (sheet) => {
    const text = sheet?.feedbackResumen || '-';
    if (text === '-') {
      return;
    }

    setFeedbackDialog({
      open: true,
      title: `Retroalimentacion ${sheet.periodStart} a ${sheet.periodEnd}`,
      text,
    });
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialog({ open: false, title: '', text: '' });
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({ open: false, title: '', message: '' });
  };

  const handleOpenDeleteConfirmDialog = (sheet) => {
    setDeleteConfirmDialog({
      open: true,
      sheetKey: sheet.key,
      periodStart: sheet.periodStart,
      periodEnd: sheet.periodEnd,
    });
  };

  const handleCloseDeleteConfirmDialog = () => {
    setDeleteConfirmDialog({ open: false, sheetKey: '', periodStart: '', periodEnd: '' });
  };

  const handleConfirmDelete = async () => {
    try {
      const { sheetKey } = deleteConfirmDialog;
      const [periodStart, periodEnd] = sheetKey.split('|');
      const sheetToDelete = sheets.find((sheet) => sheet.key === sheetKey);

      if (!sheetToDelete) {
        setErrorDialog({
          open: true,
          title: 'Hoja no disponible',
          message: 'La hoja seleccionada ya no está disponible.',
        });
        handleCloseDeleteConfirmDialog();
        return;
      }

      if (sheetToDelete.source === 'draft') {
        const draftStorageKey = `${DRAFT_STORAGE_PREFIX}:${currentUser?.id_usuario}:${periodStart}:${periodEnd}`;
        localStorage.removeItem(draftStorageKey);

        setFeedbackDialog({
          open: true,
          title: 'Éxito',
          text: 'Se eliminó el borrador de la hoja de tiempo.',
        });
        handleCloseDeleteConfirmDialog();
        return;
      }

      // Busca todos los registros de esa semana
      const registrosAEliminar = allRows.filter(
        (row) => row.fecha >= periodStart && row.fecha <= periodEnd
      );

      if (registrosAEliminar.length === 0) {
        setErrorDialog({
          open: true,
          title: 'Error',
          message: 'No se encontraron registros para eliminar.',
        });
        handleCloseDeleteConfirmDialog();
        return;
      }

      const existeDecision = registrosAEliminar.some((row) => {
        const estado = row.estado_aprobacion || 'Pendiente';
        return estado !== 'Pendiente';
      });

      if (existeDecision) {
        setErrorDialog({
          open: true,
          title: 'No se puede eliminar',
          message: 'Esta hoja ya tiene registros aprobados o rechazados. Solo se pueden eliminar hojas pendientes.',
        });
        handleCloseDeleteConfirmDialog();
        return;
      }

      // Procede a eliminar cada registro
      for (const registro of registrosAEliminar) {
        await RegistroHorasService.delete(registro.id_registro);
      }

      // Actualiza la lista de registros
      const updatedRows = allRows.filter((row) => !registrosAEliminar.find((r) => r.id_registro === row.id_registro));
      setAllRows(updatedRows);

      setFeedbackDialog({
        open: true,
        title: 'Éxito',
        text: `Se han eliminado ${registrosAEliminar.length} registro(s) de hojas de tiempo.`,
      });
      handleCloseDeleteConfirmDialog();
    } catch (error) {
      const backendMessage = error?.response?.data?.result || '';
      setErrorDialog({
        open: true,
        title: 'Error al eliminar',
        message: backendMessage || 'No fue posible eliminar los registros. Intente de nuevo.',
      });
    }
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
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Historial de Hojas de Tiempo</Typography>
            <Typography variant="body2">Seleccione una hoja para editarla por período.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/registro-horas/crear')}>
              Crear nueva hoja
            </Button>
            <Button variant="outlined" sx={headerActionButtonSx} onClick={() => navigate('/')}>
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
              setSelectedSheetKey('');
            }}>
              Limpiar Filtros
            </Button>
            <Button variant="outlined" onClick={() => handleOpenSelectedSheet(true)}>
              Ver hoja seleccionada
            </Button>
            <Button variant="contained" onClick={() => handleOpenSelectedSheet(false)}>
              Editar hoja seleccionada
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>Total hojas: {sheets.length} | Horas acumuladas: {totalHoras.toFixed(2)}</Typography>
        </Paper>

        <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 700, bgcolor: '#eef3f8' } }}>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Período</TableCell>
                <TableCell align="right">Registros</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="right">Aprob. (h)</TableCell>
                <TableCell align="right">Pend. (h)</TableCell>
                <TableCell align="right">Rech. (h)</TableCell>
                <TableCell align="center">Estado de envío</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Retroalimentación</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">Cargando historial...</TableCell>
                </TableRow>
              ) : sheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No hay hojas con los filtros actuales.</TableCell>
                </TableRow>
              ) : (
                sheets.map((sheet) => (
                  <TableRow key={sheet.key} hover>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedSheetKey === sheet.key} onChange={() => setSelectedSheetKey(sheet.key)} />
                    </TableCell>
                    <TableCell>{sheet.periodStart} a {sheet.periodEnd}</TableCell>
                    <TableCell align="right">{sheet.totalRegistros}</TableCell>
                    <TableCell align="right">{Number(sheet.totalHoras || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(sheet.horasAprobadas || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(sheet.horasPendientes || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(sheet.horasRechazadas || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={(sheet.estadoEnvio || 'Enviado').toUpperCase()}
                        sx={sheet.estadoEnvio === 'Pendiente de envio' ? pendienteChipSx : enviadoChipSx}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        sx={sheet.estadoHoja === 'Aprobado' ? aprobadoChipSx : sheet.estadoHoja === 'Rechazado' ? rechazadoChipSx : pendienteChipSx}
                        label={(sheet.estadoHoja || 'Pendiente').toUpperCase()}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      {sheet.feedbackResumen && sheet.feedbackResumen !== '-' ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title="Esta hoja tiene retroalimentacion" arrow>
                            <WarningAmberOutlinedIcon sx={{ color: '#b26a00', fontSize: 20 }} />
                          </Tooltip>
                          <Tooltip title={sheet.feedbackResumen} arrow placement="top-start">
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 220,
                              }}
                            >
                              {sheet.feedbackResumen}
                            </Typography>
                          </Tooltip>
                          <Button size="small" variant="outlined" onClick={() => handleOpenFeedbackDialog(sheet)}>
                            Ver
                          </Button>
                        </Stack>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip
                        title={
                          sheet.source === 'draft' || sheet.estadoHoja === 'Pendiente'
                            ? 'Eliminar hoja de tiempo'
                            : 'Solo se pueden eliminar hojas pendientes o borradores'
                        }
                        arrow
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirmDialog(sheet)}
                            disabled={sheet.source !== 'draft' && sheet.estadoHoja !== 'Pendiente'}
                          >
                            <DeleteOutlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={feedbackDialog.open} onClose={handleCloseFeedbackDialog} fullWidth maxWidth="sm">
        <DialogTitle>{feedbackDialog.title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{feedbackDialog.text}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseFeedbackDialog} autoFocus>
            Cerrar
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

      <Dialog open={deleteConfirmDialog.open} onClose={handleCloseDeleteConfirmDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar hoja de tiempo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la hoja de tiempo del período {deleteConfirmDialog.periodStart} a {deleteConfirmDialog.periodEnd}? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCloseDeleteConfirmDialog}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
