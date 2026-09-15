import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Course } from "../types";

export default function TeacherCourses() {
  const auth = useAuth();
  const token = auth.user?.id_token ?? "";
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.teacherMyCourses(token).then(setCourses).catch((e) => setError(e.message));
  }, [token]);

  return (
    <section>
      <h1>Teacher · My courses</h1>
      {error && <p className="error">{error}</p>}
      <ul className="card">
        {courses.map((c) => (
          <li key={c.id}>
            <Link to={`/teacher/${c.id}`}>#{c.id} — {c.name}</Link>
          </li>
        ))}
        {courses.length === 0 && <li>No courses assigned yet.</li>}
      </ul>
    </section>
  );
}