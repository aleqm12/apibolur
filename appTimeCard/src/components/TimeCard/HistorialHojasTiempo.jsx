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
import Checkbox from '@mui/material/Checkbox';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RegistroHorasService from '../../services/RegistroHorasService';

const DRAFT_STORAGE_PREFIX = 'timeSheetDraft';

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

const enviadoChipSx = {
  bgcolor: '#2e7d32',
  color: '#ffffff',
  fontWeight: 700,
  border: '1px solid rgba(255, 255, 255, 0.2)',
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

  const sheets = useMemo(() => {
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
          estados: new Set(),
        };
      }

      accumulator[key].totalRegistros += 1;
      accumulator[key].totalHoras += Number(row.horas || 0);
      accumulator[key].estados.add(row.estado_aprobacion || 'Pendiente');

      return accumulator;
    }, {});

    const dbSheets = Object.values(grouped)
      .map((sheet) => {
        const estados = [...sheet.estados];
        let estadoHoja = 'Pendiente';

        if (estados.includes('Pendiente')) {
          estadoHoja = 'Pendiente';
        } else if (estados.includes('Rechazado')) {
          estadoHoja = 'Rechazado';
        } else if (estados.includes('Aprobado')) {
          estadoHoja = 'Aprobado';
        }

        return {
          ...sheet,
          estadoHoja,
          estadoEnvio: 'Enviado',
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

  const handleOpenSelectedSheet = () => {
    if (!selectedSheetKey) {
      toast.error('Seleccione una hoja para editar.');
      return;
    }

    const selectedSheet = sheets.find((item) => item.key === selectedSheetKey);
    if (!selectedSheet) {
      toast.error('La hoja seleccionada ya no esta disponible.');
      return;
    }

    const modoDestino = selectedSheet.source === 'draft' ? 'draft' : 'editar';
    navigate(`/registro-horas/crear?modo=${modoDestino}&inicio=${selectedSheet.periodStart}&fin=${selectedSheet.periodEnd}`);
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
            <Typography variant="body2">Seleccione una hoja para editarla por periodo.</Typography>
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
              Limpiar
            </Button>
            <Button variant="contained" onClick={handleOpenSelectedSheet}>
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
                <TableCell>Periodo</TableCell>
                <TableCell align="right">Registros</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="center">Estado Envio</TableCell>
                <TableCell align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Cargando historial...</TableCell>
                </TableRow>
              ) : sheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay hojas con los filtros actuales.</TableCell>
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
                        color={sheet.estadoHoja === 'Pendiente' ? 'default' : getChipColor(sheet.estadoHoja)}
                        sx={sheet.estadoHoja === 'Pendiente' ? pendienteChipSx : undefined}
                        label={(sheet.estadoHoja || 'Pendiente').toUpperCase()}
                      />
                    </TableCell>
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
