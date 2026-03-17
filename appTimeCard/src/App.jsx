import { useEffect } from 'react';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { appTheme } from "./themes/theme";
import { Layout } from "./components/Layout/Layout";
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const PASSWORD_REMINDER_DAYS = 90;

export default function App() { 
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isLoginRoute = location.pathname === '/user/login' || location.pathname === '/user/logout';
    if (isLoginRoute) {
      return;
    }

    const rawAuthUser = localStorage.getItem('authUser');
    if (!rawAuthUser) {
      return;
    }

    let authUser;
    try {
      authUser = JSON.parse(rawAuthUser);
    } catch {
      return;
    }

    const userId = String(authUser?.id_usuario || '').trim();
    if (!userId) {
      return;
    }

    const passwordTimestampKey = `passwordLastChangedAt:${userId}`;
    const reminderShownKey = `passwordReminderShown:${userId}`;
    const storedTimestamp = localStorage.getItem(passwordTimestampKey);

    if (!storedTimestamp) {
      // Si no existe historial, se inicializa para comenzar a contar desde ahora.
      localStorage.setItem(passwordTimestampKey, new Date().toISOString());
      return;
    }

    if (sessionStorage.getItem(reminderShownKey) === '1') {
      return;
    }

    const lastChangedDate = new Date(storedTimestamp);
    if (Number.isNaN(lastChangedDate.getTime())) {
      localStorage.setItem(passwordTimestampKey, new Date().toISOString());
      return;
    }

    const elapsedMs = Date.now() - lastChangedDate.getTime();
    const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

    if (elapsedDays < PASSWORD_REMINDER_DAYS) {
      return;
    }

    sessionStorage.setItem(reminderShownKey, '1');
    const shouldNavigate = window.confirm(
      'Han pasado más de 90 días desde el último cambio de contraseña. Se recomienda actualizarla ahora. ¿Desea ir a Cambiar contraseña?'
    );

    if (shouldNavigate) {
      navigate('/user/change-password');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const isLoginRoute = location.pathname === '/user/login' || location.pathname === '/user/logout';
    const hasAuthenticatedUser = Boolean(localStorage.getItem('authUser'));

    if (isLoginRoute || !hasAuthenticatedUser) {
      return;
    }

    let timeoutId;

    const forceLogoutByInactivity = () => {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      navigate('/user/login', { replace: true });
    };

    const resetInactivityTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(forceLogoutByInactivity, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
    };
  }, [location.pathname, navigate]);

  return ( 
      <ThemeProvider theme={appTheme}> 
        <CssBaseline enableColorScheme /> 
        <Layout> 
          <Outlet /> 
        </Layout> 
      </ThemeProvider> 
  ); 
}