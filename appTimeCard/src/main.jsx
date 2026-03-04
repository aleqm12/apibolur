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
          path:'/user/create',
          element: <CreateUsuario />
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
