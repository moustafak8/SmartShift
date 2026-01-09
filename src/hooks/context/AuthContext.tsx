import React, { createContext, useContext, useState } from "react";

export type User = {
  id: number;
  user_type_id: number;
  full_name: string;
  email: string;
  password?: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type LoginPayload = {
  user: User;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  loginAction: (data: LoginPayload) => void;
  logOut: () => void;
  isAuthenticated: () => boolean;
  isManager: () => boolean;
  isEmployee: () => boolean;
  getUserRole: () => "manager" | "employee" | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loginAction = (data: LoginPayload) => {
    setUser(data.user);
    setIsLoading(false);
  };

  const logOut = () => {
    setUser(null);
    setIsLoading(false);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const isManager = () => {
    return user?.user_type_id === 1;
  };

  const isEmployee = () => {
    return user?.user_type_id === 2;
  };

  const getUserRole = (): "manager" | "employee" | null => {
    if (!user) return null;
    return user.user_type_id === 1 ? "manager" : "employee";
  };

  const value: AuthContextType = {
    user,
    isLoading,
    setUser,
    setIsLoading,
    loginAction,
    logOut,
    isAuthenticated,
    isManager,
    isEmployee,
    getUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
