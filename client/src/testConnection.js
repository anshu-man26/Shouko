import api from './api';

export const testBackendConnection = async () => {
  try {
    const response = await api.get('/health');
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}; 