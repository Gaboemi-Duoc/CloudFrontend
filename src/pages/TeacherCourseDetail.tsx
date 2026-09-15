import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Enrollment, Task } from "../types";

export default function TeacherCourseDetail() {
	const { id } = useParams<{ id: string }>();
	const courseId = Number(id);
	const auth = useAuth();
	const token = auth.user?.id_token ?? "";

	const [students, setStudents] = useState<Enrollment[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [studentEmail, setStudentEmail] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [error, setError] = useState<string | null>(null);

	const reload = async () => {
		try {
			setStudents(await api.teacherStudents(token, courseId));
			setTasks(await api.teacherTasks(token, courseId));
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	useEffect(() => {
		if (token && courseId) void reload();
	}, [token, courseId]);

	const onEnroll = async () => {
		try {
			await api.teacherEnrollStudent(token, courseId, studentEmail);
			setStudentEmail("");
			void reload();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	const onCreateTask = async () => {
		try {
			await api.teacherCreateTask(token, courseId, {
				title,
				description,
				dueDate: dueDate || undefined,
			});
			setTitle("");
			setDescription("");
			setDueDate("");
			void reload();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	return (
		<section>
			<h1>Course #{courseId}</h1>
			{error && <p className="error">{error}</p>}

			<div className="card">
				<h3>Enroll a student</h3>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void onEnroll();
					}}
				>
					<input
						placeholder="Student email (Cognito)"
						value={studentEmail}
						onChange={(e) => setStudentEmail(e.target.value)}
						required
					/>
					<button type="submit">Enroll</button>
				</form>
				<ul>
					{students.map((s) => (
						<li key={s.id}>{s.studentId}</li>
					))}
					{students.length === 0 && <li>No students enrolled.</li>}
				</ul>
			</div>

			<div className="card">
				<h3>Create a task</h3>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void onCreateTask();
					}}
				>
					<input
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
					<input
						placeholder="Description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<input
						type="date"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
					/>
					<button type="submit">Create</button>
				</form>
			</div>

			<div className="card">
				<h3>Tasks</h3>
				<ul>
					{tasks.map((t) => (
						<li key={t.id}>
							<b>{t.title}</b>
							{t.dueDate ? ` — due ${t.dueDate}` : ""}
							{t.description && <div className="muted">{t.description}</div>}
						</li>
					))}
					{tasks.length === 0 && <li>No tasks yet.</li>}
				</ul>
			</div>
		</section>
	);
}
