// client/src/api.js
import axios from "axios";

// Automatically uses the backend URL from .env
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export default api;
