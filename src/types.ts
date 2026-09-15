export interface Me {
  subject: string;
  email: string | null;
  roles: string[];
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  teacherId: string;
  createdAt: string;
}

export interface Task {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Enrollment {
  id: number;
  courseId: number;
  courseName: string;
  studentId: string;
  createdAt: string;
}