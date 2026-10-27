export interface Me {
	subject: string;
	email: string | null;
	roles: string[];
}

export interface Course {
	id: number;
	name: string;
	description?: string;
	teacher_id: string;
	created_at: string;
}

export interface Task {
	id: number;
	course_id: number;
	title: string;
	description?: string;
	due_date?: string;
	created_at: string;
}

export interface Enrollment {
	id: number;
	course_id: number;
	course_name: string; // Ensure your Lambda uses 'c.name AS course_name'
	student_id: string;
	created_at: string;
}