import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { cognitoLogoutUrl } from "../auth";

export default function Layout() {
  const auth = useAuth();
  const nav = useNavigate();
  const groups: string[] = (auth.user?.profile["cognito:groups"] as string[]) ?? [];

  const handleLogout = () => {
    const idToken = auth.user?.id_token ?? "";
    const url = cognitoLogoutUrl(idToken);
    auth.removeUser().finally(() => {
      window.location.href = url;
    });
  };

  return (
    <div className="app">
      <header>
        <strong>CloudEvaluacion</strong>
        <nav>
          <Link to="/">Home</Link>
          {groups.includes("Admin") && <Link to="/admin">Admin</Link>}
          {groups.includes("Teacher") && <Link to="/teacher">Teacher</Link>}
          {groups.includes("Student") && <Link to="/student">Student</Link>}
        </nav>
        <div className="user">
          <span>{auth.user?.profile.email as string}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}