import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, { getErrorMessage } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "crm_token";
const USER_KEY = "crm_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);

    localStorage.setItem(USER_KEY, JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  /*
   * Restore and validate an existing session.
   */
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const response = await api.get("/auth/me");

        const currentUser = response.data?.user;

        if (!currentUser) {
          throw new Error("Invalid user session.");
        }

        if (mounted) {
          setToken(savedToken);
          setUser(currentUser);

          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
      } catch (err) {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [clearSession]);

  /*
   * LOGIN
   */
  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError("");

      try {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();

        const password = String(credentials?.password || "");

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        const response = await api.post("/auth/login", {
          email,
          password,
        });

        const responseData = response.data || {};

        const newToken = responseData.token;

        const newUser = responseData.user;

        if (!newToken || !newUser) {
          throw new Error("Login response is invalid.");
        }

        saveSession(newToken, newUser);

        return responseData;
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Login failed. Please check your email and password.",
        );

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [saveSession],
  );

  /*
   * REGISTER
   */
  const register = useCallback(
    async (details) => {
      setLoading(true);
      setError("");

      try {
        const name = String(details?.name || "").trim();

        const email = String(details?.email || "")
          .trim()
          .toLowerCase();

        const password = String(details?.password || "");

        if (!name || !email || !password) {
          throw new Error("Name, email, and password are required.");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const response = await api.post("/auth/register", {
          name,
          email,
          password,
        });

        const responseData = response.data || {};

        const newToken = responseData.token;

        const newUser = responseData.user;

        if (!newToken || !newUser) {
          throw new Error("Registration response is invalid.");
        }

        /*
         * Registration automatically logs
         * the newly created user in.
         */
        saveSession(newToken, newUser);

        return responseData;
      } catch (err) {
        const message = getErrorMessage(err, "Registration failed.");

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [saveSession],
  );

  /*
   * LOGOUT
   */
  const logout = useCallback(() => {
    clearSession();
    setError("");
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      error,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      clearError: () => setError(""),
    }),
    [token, user, loading, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export default AuthContext;

