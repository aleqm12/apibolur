import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'user';

class UserService {
  getUsers() {
    return axios.get(BASE_URL);
  }

  login(credentials) {
    return axios.post(`${BASE_URL}/login`, JSON.stringify(credentials));
  }

  createUser(user) {
    return axios.post(BASE_URL, JSON.stringify(user));
  }

  updateUser(user) {
    return axios.put(BASE_URL, JSON.stringify(user));
  }

  deleteUser(userId) {
    return axios.delete(`${BASE_URL}/${userId}`);
  }
}

export default new UserService();
