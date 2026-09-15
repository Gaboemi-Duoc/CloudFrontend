import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Course, Task } from "../types";

export default function StudentDashboard() {
  const auth = useAuth();
  const token = auth.user?.id_token ?? "";
  const [mine, setMine] = useState<Course[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setMine(await api.studentMyCourses(token));
      setAvailable(await api.studentAvailableCourses(token));
      setTasks(await api.studentAllTasks(token));
    } catch (e: any) { setError(e.message); }
  };

  useEffect(() => { if (token) reload(); }, [token]);

  const enroll = async (id: number) => {
    try { await api.studentEnroll(token, id); reload(); }
    catch (e: any) { setError(e.message); }
  };

  return (
    <section>
      <h1>Student dashboard</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>My courses</h3>
        <ul>
          {mine.map((c) => <li key={c.id}>#{c.id} — {c.name} <span className="muted">({c.teacherId})</span></li>)}
          {mine.length === 0 && <li>Not enrolled in any course yet.</li>}
        </ul>
      </div>

      <div className="card">
        <h3>Available courses</h3>
        <ul>
          {available.map((c) => (
            <li key={c.id}>
              #{c.id} — {c.name}{" "}
              <button onClick={() => enroll(c.id)}>Enroll</button>
            </li>
          ))}
          {available.length === 0 && <li>No courses available.</li>}
        </ul>
      </div>

      <div className="card">
        <h3>My tasks</h3>
        <ul>
          {tasks.map((t) => (
            <li key={t.id}>
              <b>{t.title}</b> (course #{t.courseId})
              {t.dueDate ? ` — due ${t.dueDate}` : ""}
              {t.description && <div className="muted">{t.description}</div>}
            </li>
          ))}
          {tasks.length === 0 && <li>No tasks assigned.</li>}
        </ul>
      </div>
    </section>
  );
}