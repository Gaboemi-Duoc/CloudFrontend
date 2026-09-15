import type { Course, Enrollment, Me, Task } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api";

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  me: (t: string) => request<Me>("/me", t),

  // --- Admin ---
  adminListCourses: (t: string) => request<Course[]>("/admin/courses", t),
  adminCreateCourse: (
    t: string,
    body: { name: string; description?: string; teacherId: string }
  ) =>
    request<Course>("/admin/courses", t, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminAssignTeacher: (t: string, id: number, teacherId: string) =>
    request<Course>(`/admin/courses/${id}/teacher`, t, {
      method: "PUT",
      body: JSON.stringify({ teacherId }),
    }),
  adminDeleteCourse: (t: string, id: number) =>
    request<void>(`/admin/courses/${id}`, t, { method: "DELETE" }),
  adminEnrollStudent: (t: string, id: number, studentId: string) =>
    request<Enrollment>(`/admin/courses/${id}/enrollments`, t, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),
  adminListStudents: (t: string, id: number) =>
    request<Enrollment[]>(`/admin/courses/${id}/students`, t),

  // --- Teacher ---
  teacherMyCourses: (t: string) => request<Course[]>("/teacher/courses", t),
  teacherStudents: (t: string, id: number) =>
    request<Enrollment[]>(`/teacher/courses/${id}/students`, t),
  teacherTasks: (t: string, id: number) =>
    request<Task[]>(`/teacher/courses/${id}/tasks`, t),
  teacherCreateTask: (
    t: string,
    id: number,
    body: { title: string; description?: string; dueDate?: string }
  ) =>
    request<Task>(`/teacher/courses/${id}/tasks`, t, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  teacherEnrollStudent: (t: string, id: number, studentId: string) =>
    request<Enrollment>(`/teacher/courses/${id}/enrollments`, t, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),

  // --- Student ---
  studentMyCourses: (t: string) => request<Course[]>("/student/courses", t),
  studentAvailableCourses: (t: string) =>
    request<Course[]>("/student/courses/available", t),
  studentEnroll: (t: string, id: number) =>
    request<Enrollment>(`/student/courses/${id}/enroll`, t, { method: "POST" }),
  studentTasksOfCourse: (t: string, id: number) =>
    request<Task[]>(`/student/courses/${id}/tasks`, t),
  studentAllTasks: (t: string) => request<Task[]>("/student/tasks", t),
};