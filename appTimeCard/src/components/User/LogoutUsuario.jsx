import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function LogoutUsuario() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/user/login', { replace: true });
  }, [navigate]);

  return null;
}
