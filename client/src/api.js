import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: 'http://localhost:5000', // Direct connection to backend
  withCredentials: true, // Include cookies in requests
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Add token from localStorage if cookie is not available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api; 