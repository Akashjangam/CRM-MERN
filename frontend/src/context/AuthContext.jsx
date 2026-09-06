import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

/* =========================================================
   CREATE CONTEXT
   ========================================================= */

const AuthContext = createContext(null);

/* =========================================================
   READ USER FROM LOCAL STORAGE
   ========================================================= */

function readUser() {
  try {
    const value = localStorage.getItem("user");

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to read user from localStorage:", error);

    return null;
  }
}

/* =========================================================
   AUTH PROVIDER
   ========================================================= */

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [user, setUser] = useState(readUser);

  /* =======================================================
     PERSIST AUTH DATA
     ======================================================= */

  const persist = useCallback((nextToken, nextUser) => {
    console.log("AUTH PERSIST:", {
      hasToken: Boolean(nextToken),
      user: nextUser,
    });

    /* -----------------------------
         TOKEN
      ----------------------------- */

    if (nextToken) {
      localStorage.setItem("token", nextToken);
    } else {
      localStorage.removeItem("token");
    }

    /* -----------------------------
         USER
      ----------------------------- */

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }

    /* -----------------------------
         REACT STATE
      ----------------------------- */

    setToken(nextToken || null);
    setUser(nextUser || null);
  }, []);

  /* =======================================================
     LOGIN
     ======================================================= */

  const login = useCallback(
    async (credentials) => {
      try {
        console.log("LOGIN REQUEST:", credentials.email);

        const { data } = await api.post("/auth/login", credentials);

        console.log("LOGIN RESPONSE:", data);

        /* --------------------------------
           Validate login response
        -------------------------------- */

        if (!data?.token) {
          throw new Error(
            "Login succeeded but JWT token was not returned by the server.",
          );
        }

        if (!data?.user) {
          throw new Error(
            "Login succeeded but user information was not returned by the server.",
          );
        }

        /* --------------------------------
           Save token + user
        -------------------------------- */

        persist(data.token, data.user);

        /* --------------------------------
           Verify storage
        -------------------------------- */

        console.log("TOKEN SAVED:", Boolean(localStorage.getItem("token")));

        console.log("USER SAVED:", localStorage.getItem("user"));

        return data;
      } catch (error) {
        console.error("LOGIN ERROR:", error);

        throw error;
      }
    },
    [persist],
  );

  /* =======================================================
     REGISTER
     ======================================================= */

  const register = useCallback(
    async (payload) => {
      try {
        console.log("REGISTER REQUEST:", payload);

        const { data } = await api.post("/auth/register", payload);

        console.log("REGISTER RESPONSE:", data);

        /*
         * If backend automatically logs the user in
         * after registration, save the JWT.
         */

        if (data?.token && data?.user) {
          persist(data.token, data.user);

          console.log(
            "REGISTER TOKEN SAVED:",
            Boolean(localStorage.getItem("token")),
          );
        }

        return data;
      } catch (error) {
        console.error("REGISTER ERROR:", error);

        throw error;
      }
    },
    [persist],
  );

  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout = useCallback(() => {
    console.log("LOGOUT");

    persist(null, null);
  }, [persist]);

  /* =======================================================
     AUTH CONTEXT VALUE
     ======================================================= */

  const value = useMemo(
    () => ({
      token,

      user,

      isAuthenticated: Boolean(token),

      login,

      register,

      logout,
    }),
    [token, user, login, register, logout],
  );

  /* =======================================================
     PROVIDER
     ======================================================= */

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* =========================================================
   USE AUTH HOOK
   ========================================================= */

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
