import axios from 'axios';

const backendurl = import.meta.env.VITE_BACKEND_URL ?? 'localhost'

const API_URL = `http://${backendurl}/api`;
console.log("==============",API_URL)
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      const currentPath = window.location.pathname;
      
      // Don't try to refresh on login/register pages or callback
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/auth/callback') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.error('No refresh token available - logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh access token...');
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {}, // Empty body
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`, // Send refresh token in header
            },
          }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update the authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        console.log('Token refreshed successfully');
        processQueue(null, access_token);

        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed - logging out', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
