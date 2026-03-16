import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'project';

class ProjectService {
  // Consulta todos los proyectos activos.
  getProjects() {
    return axios.get(BASE_URL);
  }

  // Registra un nuevo proyecto.
  createProject(project) {
    return axios.post(BASE_URL, JSON.stringify(project));
  }

  // Actualiza la información de un proyecto existente.
  updateProject(project) {
    return axios.put(BASE_URL, JSON.stringify(project));
  }

  // Elimina un proyecto por su identificador.
  deleteProject(projectId) {
    return axios.delete(`${BASE_URL}/delete/${projectId}`);
  }
}

export default new ProjectService();
