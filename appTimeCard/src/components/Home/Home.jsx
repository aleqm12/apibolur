import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography'; 
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link, useNavigate } from 'react-router-dom';

export function Home() { 
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const logoBlue = '#63859E';
  const logoCandidates = [
    '/bolur-logo-horizontal.png',
    '/bolur-logo-horizontal.jpg',
    '/bolur-logo-horizontal.jpeg',
    '/bolur-logo-horizontal.webp',
    '/bolur-logo-horizontal.svg',
    '/logo-bolur-horizontal.png',
    '/logo-bolur.png',
    '/bolur-logo.png',
  ];
  const [showHomeLogo, setShowHomeLogo] = useState(true);
  const [homeLogoIndex, setHomeLogoIndex] = useState(0);

  useEffect(() => {
    // Comprueba si existe una sesión guardada antes de mostrar la vista principal.
    const storedAuthUser = localStorage.getItem('authUser');

    if (!storedAuthUser) {
      navigate('/user/login');
      return;
    }

    try {
      // Recupera los datos del usuario autenticado desde el almacenamiento local.
      const parsedAuthUser = JSON.parse(storedAuthUser);
      setCurrentUser(parsedAuthUser);
    } catch {
      // Si la sesión está corrupta, la elimina y fuerza un nuevo inicio de sesión.
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      navigate('/user/login');
    }
  }, [navigate]);

  if (!currentUser) {
    return null;
  }

  const nombreCompleto = `${currentUser.nombre || ''} ${currentUser.apellidos || ''}`.trim();

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
          borderTop: { xs: `220px solid ${logoBlue}`, md: `320px solid ${logoBlue}` },
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
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 460,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
      {showHomeLogo ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 1.8,
          }}
        >
          <Box
            component="img"
            src={logoCandidates[homeLogoIndex]}
            alt="Bolur Engineers"
            onError={() => {
              if (homeLogoIndex < logoCandidates.length - 1) {
                setHomeLogoIndex((prev) => prev + 1);
                return;
              }

              setShowHomeLogo(false);
            }}
            sx={{
              width: '100%',
              maxWidth: { xs: 300, md: 400 },
              height: 'auto',
              display: 'block',
              mixBlendMode: 'multiply',
            }}
          />
        </Box>
      ) : null}
      <Typography 
        component="h1" 
        variant="h4"
        align="center" 
        sx={{ color: logoBlue }}
        gutterBottom 
      > 
        Hola, {nombreCompleto || 'Usuario'}
        </Typography> 
      <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 600, color: logoBlue }}> 
        ¿Qué deseas hacer hoy?
      </Typography> 
    
      <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
        <Button variant="contained" color="primary" size="large" component={Link} to="/registro-horas/crear/" sx={{ width: '100%', maxWidth: 360 }}>
          Crear una nueva hoja de tiempo
        </Button>
        <Button
          variant="contained"
          size="large"
          component={Link}
          to="/registro-horas/historial"
          sx={{
            width: '100%',
            maxWidth: 360,
            borderRadius: 1.5,
            backgroundColor: logoBlue,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#4E6F87',
            },
          }}
        >
          Historial de Hojas de Tiempo
        </Button>
        <Button
          variant="outlined"
          size="large"
          component={Link}
          to="/user/logout"
          sx={{
            width: '100%',
            maxWidth: 360,
            color: logoBlue,
            borderColor: logoBlue,
            '&:hover': {
              borderColor: '#4E6F87',
              backgroundColor: 'rgba(99, 133, 158, 0.08)',
            },
          }}
        >
          Cerrar sesión
        </Button>
      </Stack>
      </Box>
      </Box>
    </Box> 
  ); 
} 