import axios from "axios";

const defaultApiUrl =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://crm-mern-it4g.onrender.com/api");

const api = axios.create({
  baseURL: defaultApiUrl,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   ATTACH JWT TOKEN TO EVERY REQUEST
   ========================================================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("API REQUEST:", config.method?.toUpperCase(), config.url);

    console.log("API BASE URL:", config.baseURL);

    console.log("JWT TOKEN EXISTS:", Boolean(token));

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;

      console.log("AUTH HEADER ATTACHED: true");
    } else {
      console.warn("AUTH HEADER ATTACHED: false - JWT token is missing");
    }

    return config;
  },
  (error) => {
    console.error("REQUEST INTERCEPTOR ERROR:", error);

    return Promise.reject(error);
  },
);

/* =========================================================
   HANDLE API RESPONSE
   ========================================================= */

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.status, response.config?.url);

    return response;
  },

  (error) => {
    console.error(
      "API ERROR:",
      error.response?.status,
      error.response?.data,
      error.config?.url,
    );

    /*
     * IMPORTANT:
     * Only logout automatically for 401.
     *
     * 403 = permission/role problem
     * 404 = route/resource problem
     *
     * Do not remove the token for those.
     */

    if (
      error.response?.status === 401 &&
      !["/", "/register"].includes(window.location.pathname)
    ) {
      console.warn("401 Unauthorized - clearing authentication");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.assign("/");
    }

    return Promise.reject(error);
  },
);

/* =========================================================
   ERROR MESSAGE HELPER
   ========================================================= */

export function getErrorMessage(error, fallback = "Something went wrong.") {
  return error?.response?.data?.message || error?.message || fallback;
}

export default api;
