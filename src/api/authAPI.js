import axiosClient from './axiosClient';

const authAPI = {
  signup: (login, password) =>
    axiosClient.post('/auth/signup', { login, password }),

  signin: (login, password) =>
    axiosClient.post('/auth/signin', { login, password }),

  signout: (token) =>
    axiosClient.post('/auth/signout', { token }),

};

export default authAPI;