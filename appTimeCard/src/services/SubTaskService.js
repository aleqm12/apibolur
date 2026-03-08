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
    const payloads = subTasks.map((subTask) => {
      return {
        id_subtarea: subTask.id_subtarea,
        id_proyecto: idProyecto,
        nombre_tarea: subTask.nombre_tarea,
      };
    });

    const requests = payloads.map((payload) => {
      return this.createSubTask(payload);
    });

    const settledResults = await Promise.allSettled(requests);

    return settledResults.map((result, index) => ({
      ...result,
      payload: payloads[index],
    }));
  }
}

export default new SubTaskService();
