import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { Link, useNavigate } from 'react-router-dom';

export function AdminPanel() {
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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

  if (!currentUser) {
    return null;
  }

  const fullName = `${currentUser.nombre || ''} ${currentUser.apellidos || ''}`.trim();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLogoutDialogOpen(true);
  };

  const handleCloseLogoutDialog = () => {
    setLogoutDialogOpen(false);
    navigate('/');
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

  const menuCards = [
    {
      id: 'usuarios',
      title: 'Usuarios',
      subtitle: 'Administración de usuarios, roles y permisos.',
      color: '#1f54c9',
      icon: <GroupOutlinedIcon sx={{ fontSize: 34 }} />,
      to: '/user/create',
    },
    {
      id: 'proyectos',
      title: 'Proyectos',
      subtitle: 'Control de proyectos, alcance y datos principales.',
      color: '#d97706',
      icon: <FolderOpenOutlinedIcon sx={{ fontSize: 34 }} />,
      to: '/project/crear/',
    },
    {
      id: 'aprobaciones',
      title: 'Aprobaciones',
      subtitle: 'Revisión de registros de tiempo.',
      color: '#0b8a4b',
      icon: <RuleFolderOutlinedIcon sx={{ fontSize: 34 }} />,
      to: '/aprobaciones/crear',
    },
    {
      id: 'historial',
      title: 'Historial de Aprobaciones',
      subtitle: 'Consulta de aprobaciones previas y auditoría.',
      color: '#0b766e',
      icon: <HistoryEduOutlinedIcon sx={{ fontSize: 34 }} />,
      to: '/admin/aprobaciones/historial',
    },
    {
      id: 'reportes',
      title: 'Reportes y Estadísticas',
      subtitle: 'Análisis operativo y métricas de rendimiento.',
      color: '#ea580c',
      icon: <BarChartOutlinedIcon sx={{ fontSize: 34 }} />,
      disabled: true,
    },
  ];

  return (
    <Grid container spacing={1} sx={{ bgcolor: '#eef2f7', minHeight: '100vh' }}>
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
            <Typography variant="body2" sx={{ color: 'secondary.contrastText' }}>
              Usuario: {fullName || currentUser.id_usuario}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.contrastText' }}>
              Panel de Administración
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'secondary.contrastText' }}>
              Inicio
            </Typography>
          </Grid>

          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}
          >
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={headerActionButtonSx}
            >
              Cerrar Sesión
            </Button>
          </Grid>
        </Grid>
      </Grid>

      <Grid size={12} sx={{ px: { xs: 2, md: 3 }, pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
          }}
        >
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
              Bienvenido al Sistema
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              Selecciona un módulo para comenzar a trabajar.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            {menuCards.map((item) => {
              const cardContent = (
                <Paper
                  elevation={0}
                  sx={{
                    width: '100%',
                    height: 210,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'rgba(15, 23, 42, 0.08)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    opacity: item.disabled ? 0.78 : 1,
                    '&:hover': item.disabled
                      ? {}
                      : {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                        },
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 2,
                      color: '#fff',
                      background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Stack spacing={1} sx={{ p: 2.1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 800, color: '#0f172a', minHeight: 40, textAlign: 'center' }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#475569', lineHeight: 1.35, minHeight: 34, textAlign: 'center' }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Stack>
                </Paper>
              );

              return (
                <Box
                  key={item.id}
                  sx={{
                    width: {
                      xs: '100%',
                      sm: 'calc(50% - 8px)',
                      md: 'calc(33.333% - 11px)',
                      xl: 'calc(20% - 13px)',
                    },
                    minWidth: { xs: '100%', sm: 260, md: 280, xl: 210 },
                    maxWidth: { xs: '100%', xl: 260 },
                  }}
                >
                  {item.disabled ? (
                    <Button
                      type="button"
                      disabled
                      fullWidth
                      sx={{ p: 0, borderRadius: 2, textAlign: 'left', textTransform: 'none' }}
                    >
                      {cardContent}
                    </Button>
                  ) : (
                    <Button
                      component={Link}
                      to={item.to}
                      fullWidth
                      sx={{
                        p: 0,
                        borderRadius: 2,
                        textAlign: 'left',
                        textTransform: 'none',
                        alignItems: 'stretch',
                      }}
                    >
                      {cardContent}
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Grid>

      <Dialog open={logoutDialogOpen} onClose={handleCloseLogoutDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Sesión cerrada</DialogTitle>
        <DialogContent>
          <Typography>La sesión se cerró correctamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleCloseLogoutDialog} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
