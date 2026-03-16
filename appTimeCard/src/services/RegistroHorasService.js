import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'registrohoras';

class RegistroHorasService {
  // Consulta todos los registros de horas.
  getAll() {
    return axios.get(BASE_URL);
  }

  // Crea un registro individual de horas.
  createRegistro(registro) {
    return axios.post(BASE_URL, JSON.stringify(registro));
  }

  // Crea/actualiza registros por lote para una hoja semanal.
  createBatch(registros) {
    return axios.post(`${BASE_URL}/createbatch`, JSON.stringify(registros));
  }

  // Consulta registros de horas de un colaborador específico.
  getByUser(idUsuario) {
    return axios.get(`${BASE_URL}/byuser/${idUsuario}`);
  }
}

export default new RegistroHorasService();
