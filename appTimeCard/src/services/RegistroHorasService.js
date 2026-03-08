import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'registrohoras';

class RegistroHorasService {
  getAll() {
    return axios.get(BASE_URL);
  }

  createRegistro(registro) {
    return axios.post(BASE_URL, JSON.stringify(registro));
  }

  createBatch(registros) {
    return axios.post(`${BASE_URL}/createbatch`, JSON.stringify(registros));
  }

  getByUser(idUsuario) {
    return axios.get(`${BASE_URL}/byuser/${idUsuario}`);
  }
}

export default new RegistroHorasService();
