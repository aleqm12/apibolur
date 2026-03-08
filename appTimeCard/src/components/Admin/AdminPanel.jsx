import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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

  return (
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
              sx={{
                color: 'secondary.contrastText',
                borderColor: 'secondary.contrastText',
                '&:hover': {
                  borderColor: 'secondary.contrastText',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Cerrar Sesión
            </Button>
          </Grid>
        </Grid>
      </Grid>

      <Grid size={12} sx={{ px: { xs: 2, md: 3 } }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2} direction="column" alignItems="center">
            <Button variant="contained" color="primary" size="large" component={Link} to="/user/create" sx={{ minWidth: 320 }}>
              Usuarios
            </Button>
            <Button variant="contained" color="primary" size="large" component={Link} to="/project/crear/" sx={{ minWidth: 320 }}>
              Proyectos
            </Button>
            <Button variant="contained" color="primary" size="large" component={Link} to="/aprobaciones/crear" sx={{ minWidth: 320 }}>
              Aprobaciones
            </Button>
            <Button variant="outlined" color="secondary" size="large" component={Link} to="/admin/aprobaciones/historial" sx={{ minWidth: 320 }}>
              Historial Aprobaciones
            </Button>
            <Button variant="outlined" color="secondary" size="large" disabled sx={{ minWidth: 320 }}>
              Dashboard
            </Button>
          </Stack>
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
