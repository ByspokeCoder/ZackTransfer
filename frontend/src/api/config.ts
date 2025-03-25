export const API_URL = import.meta.env.VITE_API_URL;
export const APP_NAME = import.meta.env.VITE_APP_NAME;

export const api = {
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}; 