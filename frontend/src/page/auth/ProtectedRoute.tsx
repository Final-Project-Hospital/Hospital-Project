import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  allow?: ('admin' | 'user')[];
}

export const ProtectedRoute = ({ allow }: Props) => {
  const { user } = useAuth();

  // ยังไม่ล็อกอิน → ไปหน้า login
  if (!user) return <Navigate to="/login" replace />;

  // มี role ไม่ตรง → ไปหน้า 403
  if (allow && !allow.includes(user.role))
    return <Navigate to="/403" replace />;

  return <Outlet />; // ตรงเงื่อนไข → render route ลูก
};
