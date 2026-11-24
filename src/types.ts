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
	price_cents?: number; // NEW — 0 or undefined = free
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

export type PaymentStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export interface Payment {
	id: string;
	course_id: number;
	course_name: string;
	student_id: string;
	amount_cents: number;
	currency: string;
	status: PaymentStatus;
	created_at: string;
	updated_at: string;
	failure_reason?: string;
}