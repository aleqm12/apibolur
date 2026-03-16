import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'subtask';

class SubTaskService {
  // Crea una sub tarea individual vinculada a un proyecto.
  createSubTask(subTask) {
    return axios.post(BASE_URL, JSON.stringify(subTask));
  }

  // Elimina todas las sub tareas de un proyecto (sincronizacion en edicion).
  deleteSubTasksByProject(idProyecto) {
    return axios.delete(`${BASE_URL}/deletebyproject/${idProyecto}`);
  }

  async createSubTasksByProject(idProyecto, subTasks) {
    // Prepara payloads de sub tareas para creacion masiva por proyecto.
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

    // Ejecuta todas las creaciones y retorna resultado por cada sub tarea.
    const settledResults = await Promise.allSettled(requests);

    return settledResults.map((result, index) => ({
      ...result,
      payload: payloads[index],
    }));
  }
}

export default new SubTaskService();
