import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import camelcaseKeys from "camelcase-keys";
import Cookies from "js-cookie";

// Placeholder for the refresh function - ideally comes from AuthService
// This avoids circular dependency issues if AuthService uses apiClient.
// AuthService would need refactoring or use a separate instance for its own calls.
const refreshTokenService = async (): Promise<{ access: string }>  => {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) {
        console.error("Refresh token not found in cookies.");
        throw new Error("No refresh token");
    }

    console.log("Attempting token refresh via placeholder service...");
    // Use fetch directly to avoid interceptor loop within the refresh call itself
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }) // Ensure body matches server expectation (e.g., { refresh: '...' })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Refresh failed with status ' + response.status }));
        console.error("Token refresh API call failed:", errorData);
        throw new Error(errorData.detail || 'Refresh token failed');
    }
    const data = await response.json();
    // Ensure the server response includes 'access' key
    if (!data.access) {
         console.error("Refresh response missing 'access' token:", data);
         throw new Error("Invalid refresh response format");
    }
    console.log("Token refresh successful via placeholder service.");
    return { access: data.access }; // Adjust based on actual API response structure { "access": "...", "refresh": "..." }
}

// Placeholder for logout logic
const triggerLogout = () => {
    console.error("Triggering logout due to refresh failure or missing token.");
    localStorage.removeItem("token");
    Cookies.remove("refreshToken");
    // Redirect or use custom event. Use conditional check for window object.
    if (typeof window !== 'undefined') {
        window.location.href = '/'; // Simplest redirect, consider using router if available outside hooks
    }
}


// Create the Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 5000, // Consider increasing timeout if requests are slow
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
// Array to hold requests waiting for token refresh
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: AxiosError) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token); // Resolve with the new token
    }
  });
  failedQueue = [];
};

// Request Interceptor: Adds the Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    // Add token if it exists. Response interceptor handles 401 if it's invalid/expired.
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles token refresh and camelCasing
api.interceptors.response.use(
  (response) => {
    // Convert successful response data to camelCase
    if (response.data && typeof response.data === 'object' && response.data !== null) {
      try {
        if (Array.isArray(response.data)) {
          // Handle array responses: camelCase each object in the array
          response.data = response.data.map(item =>
            typeof item === 'object' && item !== null ? camelcaseKeys(item, { deep: true }) : item
          );
        } else {
          // Handle plain object responses
          response.data = camelcaseKeys(response.data, { deep: true });
        }
      } catch (e) {
         console.warn("Failed to camelCase success response data:", e);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check for 401 Unauthorized error and ensure it's not a retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request if refresh is already in progress
        console.log("API Client: Refresh already in progress, queueing request:", originalRequest.url);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          // Update header with the new token received after refresh
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          console.log("API Client: Retrying queued request with new token:", originalRequest.url);
          return api(originalRequest); // Retry with the new token
        }).catch(err => {
          console.error("API Client: Queued request failed after refresh attempt:", err);
          return Promise.reject(err); // Propagate refresh error
        });
      }

      originalRequest._retry = true; // Mark as retry attempt
      isRefreshing = true;
      console.log("API Client: Received 401, attempting token refresh for:", originalRequest.url);

      try {
        // Call the refresh token service function
        const { access: newAccessToken } = await refreshTokenService();
        console.log("API Client: Token refreshed successfully.");
        localStorage.setItem("token", newAccessToken);

        // Update the Authorization header for the original request being retried
        if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken); // Resolve queued requests with the new token
        console.log("API Client: Retrying original request with new token:", originalRequest.url);
        return api(originalRequest); // Retry the original request

      } catch (refreshError) {
        console.error("API Client: Token refresh failed:", refreshError);
        // Ensure refreshError is an AxiosError before passing it to processQueue
        processQueue(refreshError instanceof AxiosError ? refreshError : null, null); // Reject queued requests
        triggerLogout(); // Trigger logout process
        return Promise.reject(refreshError); // Reject the original request with the refresh error
      } finally {
        isRefreshing = false; // Reset refreshing flag
      }
    }

    // Convert other error response data to camelCase only if it's an object
    // Convert other error response data to camelCase only if it's a plain object
    if (error.response?.data && typeof error.response.data === 'object' && error.response.data !== null && !Array.isArray(error.response.data)) {
        try {
            // Cast to Record<string, unknown> to satisfy camelcaseKeys
            error.response.data = camelcaseKeys(error.response.data as Record<string, unknown>, { deep: true });
        } catch (e) {
            console.warn("Failed to camelCase error response data:", e);
        }
    }
    // For non-401 errors or failed retries, reject the promise
    return Promise.reject(error);
  }
);

// Export the configured Axios instance directly for use (e.g., api.get, api.post)
export default api;

// Optional: Keep the old structure for compatibility if needed, but adapt it.
// This version is simplified as interceptors handle most logic.
export const apiClient = {
    request: async <T>(
        url: string,
        config: {
                method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
                body?: unknown;
                params?: Record<string, unknown>;
                headers?: Record<string, string>; // Allow headers to be passed in config
        }
    ): Promise<T> => {

        try {
            // Prepare base request config, including any headers passed in the config
            const requestConfig: InternalAxiosRequestConfig = {
                url,
                method: config.method,
                data: config.body,
                params: config.params, // Pass query parameters
                headers: (config.headers || {}) as import("axios").AxiosRequestHeaders, // Use passed headers or default to empty
            };


            if (config.body instanceof FormData) {

                if (!requestConfig.headers) {
                    requestConfig.headers = {} as import("axios").AxiosRequestHeaders;
                }
                requestConfig.headers['Content-Type'] = 'multipart/form-data';
            }


            if (requestConfig.data instanceof FormData) {


            }



            const response = await api.request(requestConfig);


            return response.data as T;
        } catch (error) {

            throw error;
        }
    }
};
