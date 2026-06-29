import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://localhost:7090/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
