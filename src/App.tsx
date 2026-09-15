import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Layout from "./components/Layout";
import { RequireRole } from "./components/RequireRole";
import Home from "./pages/Home";
import AdminCourses from "./pages/AdminCourses";
import TeacherCourses from "./pages/TeacherCourses";
import TeacherCourseDetail from "./pages/TeacherCourseDetail";
import StudentDashboard from "./pages/StudentDashboard";

export default function App() {
  const auth = useAuth();

  if (auth.isLoading) return <div className="center">Loading…</div>;
  if (auth.error)
    return <div className="center error">Auth error: {auth.error.message}</div>;

  if (!auth.isAuthenticated) {
    return (
      <div className="center">
        <h1>CloudEvaluacion</h1>
        <p>Sign in with Cognito to continue.</p>
        <button onClick={() => auth.signinRedirect()}>Sign in</button>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/admin"
          element={
            <RequireRole role="Admin">
              <AdminCourses />
            </RequireRole>
          }
        />
        <Route
          path="/teacher"
          element={
            <RequireRole role="Teacher">
              <TeacherCourses />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/:id"
          element={
            <RequireRole role="Teacher">
              <TeacherCourseDetail />
            </RequireRole>
          }
        />
        <Route
          path="/student"
          element={
            <RequireRole role="Student">
              <StudentDashboard />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}