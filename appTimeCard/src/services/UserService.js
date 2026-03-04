import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'user';

class UserService {
  createUser(user) {
    return axios.post(BASE_URL, JSON.stringify(user));
  }
}

export default new UserService();
