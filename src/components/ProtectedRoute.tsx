import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, hasCheckedAuth, isLoading, user } = useAuthStore();

  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check org access — super admins bypass
  if (user && !user.is_super_admin && (!user.useCases || user.useCases.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-xl font-bold text-foreground">No Organization Access</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn't have access to any organizations. Please contact an administrator.
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="text-sm text-accent hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Role-based access check
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const userRole = user.role || '';
    const hasAccess = user.is_super_admin || requiredRoles.includes(userRole);
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center space-y-3 max-w-md">
            <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
            <p className="text-sm text-muted-foreground">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="text-sm text-accent hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
