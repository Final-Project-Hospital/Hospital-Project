import { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'admin' | 'user';

interface User {
  id: number;
  firstName: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null as never);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 👉 NOTE: เปลี่ยนเป็นดึงจาก localStorage/token ตามจริง
  const [user, setUser] = useState<User | null>(null);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};