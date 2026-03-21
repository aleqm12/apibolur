import { useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid2';
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
import RegistroHorasService from '../../services/RegistroHorasService';
import GrammarSuggestionService from '../../services/GrammarSuggestionService';

export function CreateAprobaciones() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterPersona, setFilterPersona] = useState('');
  const [filterProyecto, setFilterProyecto] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSuggestions, setRejectSuggestions] = useState([]);
  const [isCheckingRejectText, setIsCheckingRejectText] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: '',
    message: '',
  });

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
      const params = {
        estado: 'Pendiente',
      };
      if (filterPersona) {
        params.id_usuario = filterPersona;
      }
      if (filterProyecto) {
        params.id_proyecto = filterProyecto;
      }

      const response = await AprobacionesService.getRegistros(params);
      const registros = Array.isArray(response?.data) ? response.data : [];
      setRows(registros);
      setSelectedIds([]);
    } catch (primaryError) {
      try {
        // Fallback defensivo: usa listado general de registros y filtra en cliente.
        const fallbackResponse = await RegistroHorasService.getAll();
        const allRows = Array.isArray(fallbackResponse?.data) ? fallbackResponse.data : [];

        const filtered = allRows.filter((row) => {
          const estadoOk = row.estado_aprobacion === 'Pendiente';
          const personaOk = !filterPersona || String(row.id_usuario) === String(filterPersona);
          const proyectoOk = !filterProyecto || String(row.id_proyecto) === String(filterProyecto);
          return estadoOk && personaOk && proyectoOk;
        });

        setRows(filtered);
        setSelectedIds([]);
      } catch (fallbackError) {
        const backendMessage =
          fallbackError?.response?.data?.result ||
          fallbackError?.response?.data?.message ||
          primaryError?.response?.data?.result ||
          primaryError?.response?.data?.message ||
          '';

        setErrorDialog({
          open: true,
          title: 'Error al cargar aprobaciones',
          message: backendMessage
            ? `No fue posible cargar los registros para aprobacion: ${backendMessage}`
            : 'No fue posible cargar los registros para aprobacion.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterPersona, filterProyecto]);

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

  const displayRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const projectA = (a.id_proyecto || '').toString();
      const projectB = (b.id_proyecto || '').toString();

      if (projectA !== projectB) {
        return projectA.localeCompare(projectB);
      }

      const userA = (a.id_usuario || '').toString();
      const userB = (b.id_usuario || '').toString();
      if (userA !== userB) {
        return userA.localeCompare(userB);
      }

      const dateA = (a.fecha || '').toString();
      const dateB = (b.fecha || '').toString();
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      return Number(a.id_registro || 0) - Number(b.id_registro || 0);
    });
  }, [rows]);

  const projectColorMap = useMemo(() => {
    const palette = ['#7A1E3A', '#1f4b74', '#1f4d2e', '#7a3e00', '#5b2b7a', '#0f766e'];
    const map = {};
    let index = 0;

    displayRows.forEach((row) => {
      const key = row.id_proyecto || 'SIN-PROYECTO';
      if (!map[key]) {
        map[key] = palette[index % palette.length];
        index += 1;
      }
    });

    return map;
  }, [displayRows]);

  const isAllSelected = displayRows.length > 0 && selectedIds.length === displayRows.length;

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

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(displayRows.map((row) => row.id_registro));
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

  const submitDecision = async (estadoResultante, targetRows, motivoRechazo = '', options = {}) => {
    const isBulkApproval = Boolean(options?.isBulkApproval);

    if (!targetRows || targetRows.length === 0) {
      setErrorDialog({
        open: true,
        title: 'No se puede continuar',
        message: 'Seleccione al menos un registro.',
      });
      return;
    }

    if (estadoResultante === 'Rechazado' && motivoRechazo.trim() === '') {
      setErrorDialog({
        open: true,
        title: 'Motivo requerido',
        message: 'Debe indicar un motivo de rechazo.',
      });
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
        if (estadoResultante === 'Aprobado' && isBulkApproval) {
          setSuccessDialog({
            open: true,
            title: 'Aprobacion masiva completada',
            message: `Se aprobaron correctamente ${total} registro(s).`,
          });
        } else {
          toast.success(`Se procesaron ${total} registro(s).`);
        }
      } else {
        toast('No se realizaron cambios.');
      }

      if ((response?.data?.total_errores || 0) > 0) {
        setErrorDialog({
          open: true,
          title: 'Guardado con observaciones',
          message: 'Algunas decisiones no se pudieron guardar. Revise el servidor.',
        });
      }

      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectSuggestions([]);
      await loadRows();
    } catch {
      setErrorDialog({
        open: true,
        title: 'Error al guardar',
        message: 'No fue posible guardar la aprobación.',
      });
    }
  };

  const handleApproveSelected = async () => {
    await submitDecision('Aprobado', selectedRows, '', {
      isBulkApproval: selectedRows.length > 1,
    });
  };

  const handleRejectSelected = () => {
    if (selectedRows.length === 0) {
      setErrorDialog({
        open: true,
        title: 'No se puede rechazar',
        message: 'Seleccione al menos un registro.',
      });
      return;
    }
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    await submitDecision('Rechazado', selectedRows, rejectReason);
  };

  useEffect(() => {
    if (!rejectDialogOpen) {
      return;
    }

    const normalizedText = (rejectReason || '').trim();
    if (normalizedText.length < 8) {
      setRejectSuggestions([]);
      setIsCheckingRejectText(false);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsCheckingRejectText(true);
      const suggestions = await GrammarSuggestionService.checkText(normalizedText, 'es');
      setRejectSuggestions(suggestions);
      setIsCheckingRejectText(false);
    }, 700);

    return () => clearTimeout(timerId);
  }, [rejectReason, rejectDialogOpen]);

  const handleApplyRejectSuggestion = (suggestion) => {
    setRejectReason((current) => GrammarSuggestionService.applySuggestion(current, suggestion));
  };

  const handleSingleDecision = async (row, estadoResultante) => {
    if (estadoResultante === 'Rechazado') {
      setSelectedIds([row.id_registro]);
      setRejectDialogOpen(true);
      return;
    }
    await submitDecision(estadoResultante, [row]);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setRejectSuggestions([]);
    setIsCheckingRejectText(false);
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

  const handleCloseErrorDialog = () => {
    setErrorDialog({
      open: false,
      title: '',
      message: '',
    });
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialog({
      open: false,
      title: '',
      message: '',
    });
  };

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
                Aprobación de Tiempos
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
          <Button variant="outlined" onClick={() => {
            setFilterPersona('');
            setFilterProyecto('');
          }}>
            Limpiar Filtros
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
                <TableCell>FECHA</TableCell>
                <TableCell>PROYECTO / TAREA</TableCell>
                <TableCell align="center">HRS</TableCell>
                <TableCell align="center">ESTADO</TableCell>
                <TableCell align="center">ACCION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Cargando registros...
                  </TableCell>
                </TableRow>
              ) : displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay registros para mostrar con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => {
                  const isSelected = selectedIds.includes(row.id_registro);
                  const rowProjectColor = projectColorMap[row.id_proyecto || 'SIN-PROYECTO'] || '#7A1E3A';
                  const estadoRow = row.estado_aprobacion || 'Pendiente';
                  return (
                    <TableRow
                      key={row.id_registro}
                      hover
                      sx={{
                        borderLeft: `4px solid ${rowProjectColor}`,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} onChange={(event) => toggleSelectRow(row.id_registro, event.target.checked)} />
                      </TableCell>
                      <TableCell>
                        [{row.id_usuario}] {(row.nombre || '').trim()} {(row.apellidos || '').trim()}
                      </TableCell>
                      <TableCell>{row.fecha || '-'}</TableCell>
                      <TableCell>
                        [{row.id_proyecto}] {row.nombre_proyecto || row.id_proyecto} / {row.nombre_tarea || row.id_subtarea}
                      </TableCell>
                      <TableCell align="center">{Number(row.horas || 0).toFixed(1)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={estadoRow.toUpperCase()}
                          sx={estadoRow === 'Aprobado' ? aprobadoChipSx : estadoRow === 'Rechazado' ? rechazadoChipSx : pendienteChipSx}
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

      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} fullWidth maxWidth="sm">
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
            helperText={
              isCheckingRejectText
                ? 'Revisando ortografia y redaccion...'
                : rejectSuggestions.length > 0
                  ? rejectSuggestions[0].replacement
                    ? `Sugerencia: cambiar "${rejectSuggestions[0].original}" por "${rejectSuggestions[0].replacement}".`
                    : `Sugerencia: ${rejectSuggestions[0].message}`
                  : ' '
            }
          />
          {rejectSuggestions.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {rejectSuggestions.map((suggestion, index) => (
                <Button
                  key={`${suggestion.offset}-${index}`}
                  size="small"
                  variant="outlined"
                  onClick={() => handleApplyRejectSuggestion(suggestion)}
                  disabled={!suggestion.replacement}
                >
                  {suggestion.replacement ? `Aplicar: ${suggestion.replacement}` : 'Ver sugerencia'}
                </Button>
              ))}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Cancelar</Button>
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

      <Dialog open={successDialog.open} onClose={handleCloseSuccessDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{successDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{successDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseSuccessDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
