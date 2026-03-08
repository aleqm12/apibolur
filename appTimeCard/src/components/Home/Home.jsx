import Typography from '@mui/material/Typography'; 
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';

export function Home() { 
  return ( 
    <Box
      sx={{
        p: 0,
        width: '100%',
        minHeight: 'calc(100vh - 6rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowX: 'hidden',
      }}
    > 
      <Box
        sx={{
          width: '100%',
          minHeight: 'calc(100vh - 6rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
          py: { xs: 4, md: 6 },
          px: { xs: 2, md: 3 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderTop: { xs: '220px solid #102A43', md: '320px solid #102A43' },
          borderLeft: { xs: '220px solid transparent', md: '320px solid transparent' },
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 0,
          height: 0,
          borderBottom: { xs: '220px solid #7A1E3A', md: '320px solid #7A1E3A' },
          borderRight: { xs: '220px solid transparent', md: '320px solid transparent' },
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Typography 
        component="h1" 
        variant="h4"
        align="center" 
        color="secondary.main" 
        gutterBottom 
      > 
        Bienvenido
        </Typography> 
      <Typography variant="h5" align="center" color="secondary.main" sx={{ mb: 2, fontWeight: 600 }}> 
        Alejandro Quesada Molina
      </Typography> 
    
      <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
        <Button variant="contained" color="primary" size="large" component={Link} to="/registro-horas/crear/" sx={{ minWidth: 320 }}>
          Crear una nueva hoja de tiempo
        </Button>
        <Button variant="contained" color="primary" size="large" sx={{ minWidth: 320 }}>
          Hoja de Tiempo Activa
        </Button>
        <Button variant="outlined" color="secondary" size="large" component={Link} to="/admin/panel" sx={{ minWidth: 320 }}>
          Panel de Administración
        </Button>
      </Stack>
      </Box>
      </Box>
    </Box> 
  ); 
} 