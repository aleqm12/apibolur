import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function LogoutUsuario() {
  const navigate = useNavigate();

  useEffect(() => {
    // Elimina la información de autenticación almacenada en el navegador.
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    sessionStorage.clear();

    // Devuelve al usuario al formulario de acceso después de cerrar sesión.
    navigate('/user/login', { replace: true });
  }, [navigate]);

  return null;
}
