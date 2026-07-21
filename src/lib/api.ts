import axios from "axios";

// Create Axios client with base URL pointing to the backend API route prefix
const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for receiving/sending HTTP-only refresh cookies
});

// Request Interceptor (relying entirely on secure HTTP-only cookies)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Queue system to hold concurrent requests during token refresh operations
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = [];

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

// Response Interceptor: Seamlessly intercepts 401 Unauthorized errors to attempt session refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard to ensure we only retry authorization-failing requests once
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh token endpoint, cookies are sent automatically withCredentials
        await axios.post("/api/auth/refresh", {}, {
          withCredentials: true,
        });

        processQueue(null, null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Session expired: dispatch unauthorized event to notify AuthContext
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-unauthorized"));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Standardize error message formats from the API
    const apiErrorMsg = error.response?.data?.message || error.message;
    return Promise.reject(new Error(apiErrorMsg));
  }
);

export default api;
