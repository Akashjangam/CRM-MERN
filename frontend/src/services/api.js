import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * Attach JWT token to every protected request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("crm_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
 * Handle authentication failures globally.
 */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      /*
       * Do not immediately clear the session
       * for /auth/me during initial validation.
       * AuthContext handles that.
       */
      if (!requestUrl.includes("/auth/me")) {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
      }
    }

    return Promise.reject(error);
  },
);

/*
 * Convert backend/API errors into a clean message.
 */
export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (!error) {
    return fallback;
  }

  /*
   * Backend response:
   * {
   *   success: false,
   *   message: "..."
   * }
   */
  const serverMessage = error.response?.data?.message;

  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  /*
   * Validation errors.
   */
  const validationErrors = error.response?.data?.errors;

  if (Array.isArray(validationErrors)) {
    return validationErrors
      .map((item) => (typeof item === "string" ? item : item?.message))
      .filter(Boolean)
      .join(", ");
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  if (!error.response) {
    return "Unable to connect to the server.";
  }

  return error.message || fallback;
}

export default api;

