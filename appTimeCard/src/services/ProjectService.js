import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'project';

class ProjectService {
  createProject(project) {
    return axios.post(BASE_URL, JSON.stringify(project));
  }
}

export default new ProjectService();
