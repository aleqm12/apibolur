import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'subtask';

class SubTaskService {
  createSubTask(subTask) {
    return axios.post(BASE_URL, JSON.stringify(subTask));
  }

  deleteSubTasksByProject(idProyecto) {
    return axios.delete(`${BASE_URL}/deletebyproject/${idProyecto}`);
  }

  async createSubTasksByProject(idProyecto, subTasks) {
    const requests = subTasks.map((subTask) => {
      const payload = {
        id_subtarea: subTask.id_subtarea,
        id_proyecto: idProyecto,
        nombre_tarea: subTask.nombre_tarea,
      };
      return this.createSubTask(payload);
    });

    return Promise.all(requests);
  }
}

export default new SubTaskService();
