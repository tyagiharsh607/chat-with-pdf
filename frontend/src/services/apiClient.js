import axios from "axios";
const createApiClient = () => {
  const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  });

  // Request interceptor to add auth header
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("chat_pdf_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor to handle token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem("chat_pdf_refresh_token");

        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh-token`,
              { refresh_token: refreshToken }
            );

            // Update stored tokens
            localStorage.setItem(
              "chat_pdf_access_token",
              refreshResponse.data.access_token
            );
            localStorage.setItem(
              "chat_pdf_refresh_token",
              refreshResponse.data.refresh_token
            );
            localStorage.setItem(
              "chat_pdf_token_expires_at",
              Date.now() + 3600 * 1000
            );

            // Retry original request with new token
            error.config.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
            return api.request(error.config);
          } catch (refreshError) {
            // Refresh failed - redirect to login
            localStorage.clear();
            window.location.href = "/login";
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const apiClient = createApiClient();
