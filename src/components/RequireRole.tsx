import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export function RequireRole({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const groups: string[] = (auth.user?.profile["cognito:groups"] as string[]) ?? [];
  if (!groups.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}