import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { Link, useNavigate } from 'react-router-dom';

export function AdminPanel() {
  const navigate = useNavigate();

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
              Usuario: Alejandro Quesada Molina
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.contrastText' }}>
              Panel de Administración
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'secondary.contrastText' }}>
              Inicio de Administración
            </Typography>
          </Grid>

          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{
                color: 'secondary.contrastText',
                borderColor: 'secondary.contrastText',
                '&:hover': {
                  borderColor: 'secondary.contrastText',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Volver a Home
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
            <Button variant="outlined" color="secondary" size="large" disabled sx={{ minWidth: 320 }}>
              Aprobaciones
            </Button>
            <Button variant="outlined" color="secondary" size="large" disabled sx={{ minWidth: 320 }}>
              Dashboard
            </Button>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
