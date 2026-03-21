import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'aprobaciones';

class AprobacionesService {
  getRegistros(params = {}) {
    return axios.get(BASE_URL, { params });
  }

  getHistorial(params = {}) {
    return axios.get(`${BASE_URL}/historial`, { params });
  }

  createAprobaciones(payload) {
    return axios.post(BASE_URL, JSON.stringify(payload));
  }

  updateAprobacion(payload) {
    return axios.put(BASE_URL, JSON.stringify(payload));
  }
}

export default new AprobacionesService();
