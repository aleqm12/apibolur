import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter } from "react-router-dom";
import { Home } from "./components/Home/Home";
import { RouterProvider } from "react-router";
import { PageNotFound } from "./components/Home/PageNotFound";
import { ListMovies } from "./components/Movie/ListMovies";
import { DetailMovie } from "./components/Movie/DetailMovie";
import ListRentals from "./components/Rental/ListRentals";
import DetailRental from "./components/Rental/DetailRental";
import TableMovies from "./components/Movie/TableMovies";
import { CreateMovie } from "./components/Movie/CreateMovie";
import { UpdateMovie } from "./components/Movie/UpdateMovie";
import { CreateProject } from "./components/Project/CreateProject";
import { CreateUsuario } from "./components/User/CreateUsuario";
import { LoginUsuario } from "./components/User/LoginUsuario";
import { LogoutUsuario } from "./components/User/LogoutUsuario";
import { ChangePasswordUsuario } from "./components/User/ChangePasswordUsuario";
import { AdminPanel } from "./components/Admin/AdminPanel";
import { HistorialAprobaciones } from "./components/Admin/HistorialAprobaciones";
import { ReportesEstadisticas } from "./components/Admin/ReportesEstadisticas";
import { CreateRegistrodeHoras } from "./components/TimeCard/CreateRegistrodeHoras";
import { ActiveTimeSheet } from "./components/TimeCard/ActiveTimeSheet";
import { HistorialHojasTiempo } from "./components/TimeCard/HistorialHojasTiempo";
import { CreateAprobaciones } from "./components/TimeCard/CreateAprobaciones";
const rutas=createBrowserRouter(
  [
    {
      element: <App />,
      children:[
        {
          path:'/',
          element: <Home />
        },
        {
          path: '*',
          element: <PageNotFound />
        },
        {
          path:'/movie/',
          element: <ListMovies />
        },
        {
          path:'/movie/:id',
          element: <DetailMovie />
        },
        {
          path:'/movie-table',
          element: <TableMovies />
        },
        {
          path:'/rental',
          element: <ListRentals />
        },
        {
          path:'/retal/:id',
          element: <DetailRental />
        },
        {
          path:'/movie/crear/',
          element: <CreateMovie />
        },
        {
          path:'/movie/update/:id',
          element: <UpdateMovie />
        },
        {
          path:'/project/crear/',
          element: <CreateProject />
        },
        {
          path:'/registro-horas/crear/',
          element: <CreateRegistrodeHoras />
        },
        {
          path:'/registro-horas/crear',
          element: <CreateRegistrodeHoras />
        },
        {
          path:'/registro-horas/activa',
          element: <ActiveTimeSheet />
        },
        {
          path:'/registro-horas/historial',
          element: <HistorialHojasTiempo />
        },
        {
          path:'/aprobaciones/crear',
          element: <CreateAprobaciones />
        },
        {
          path:'/admin/aprobaciones/historial',
          element: <HistorialAprobaciones />
        },
        {
          // Ruta principal del modulo de administracion de empleados.
          path:'/user/create',
          element: <CreateUsuario />
        },
        {
          // Ruta pública para mostrar el formulario de autenticación.
          path:'/user/login',
          element: <LoginUsuario />
        },
        {
          // Ruta encargada de cerrar sesión y limpiar el estado local.
          path:'/user/logout',
          element: <LogoutUsuario />
        },
        {
          path:'/user/change-password',
          element: <ChangePasswordUsuario />
        },
        {
          path:'/admin/panel',
          element: <AdminPanel />
        },
        {
          path:'/admin/reportes',
          element: <ReportesEstadisticas />
        }
      ]
    }
  ]
)

createRoot(document.getElementById("root")).render(
  <StrictMode> 
  <RouterProvider router={rutas} /> 
</StrictMode>, 
);
