import axios from 'axios';
export const api = axios.create({
  baseURL: 'http://192.168.69.159:3000' + '/api',
  timeout: 3000,
});
