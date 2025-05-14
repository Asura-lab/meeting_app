// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  [x: string]: any;
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  isEmailVerified: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<any>; // Return type can be more specific
  register: (userData: RegisterData) => Promise<any>; // Return type can be more specific
  logout: () => void;
  isEmailVerified: boolean;
  setAuthData: (token: string, user: User) => void; // New function
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isEmailVerified: false,
  setAuthData: () => {}, // Default empty implementation
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    // Check if user is logged in on page load
    const checkUserLoggedIn = async () => {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem("token");
        if (stored) {
          setToken(stored);
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${stored}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
            setIsEmailVerified(data.user.isEmailVerified);
          } else {
            localStorage.removeItem("token");
            setToken(null);
            setIsEmailVerified(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("token");
        setToken(null);
        setIsEmailVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const setAuthData = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken); // Ensure localStorage is also set here
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    setIsEmailVerified(newUser.isEmailVerified);
    setIsLoading(false); // Assuming user is loaded
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token in both cookie and localStorage for compatibility
      // localStorage.setItem("token", data.token); // Handled by setAuthData or directly
      // setToken(data.token);
      // setUser(data.user);
      // setIsAuthenticated(true);
      // setIsEmailVerified(data.user.isEmailVerified);
      setAuthData(data.token, data.user); // Use the new function
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsEmailVerified(false);
    // Optionally, clear HttpOnly cookie by calling a logout API endpoint
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        token,
        login,
        register,
        logout,
        isEmailVerified,
        setAuthData, // Provide the new function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
