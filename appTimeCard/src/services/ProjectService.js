import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'project';

class ProjectService {
  getProjects() {
    return axios.get(BASE_URL);
  }

  createProject(project) {
    return axios.post(BASE_URL, JSON.stringify(project));
  }

  updateProject(project) {
    return axios.put(BASE_URL, JSON.stringify(project));
  }

  deleteProject(projectId) {
    return axios.delete(`${BASE_URL}/delete/${projectId}`);
  }
}

export default new ProjectService();
