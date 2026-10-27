import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Course, Enrollment } from "../types";

export default function AdminCourses() {
	const auth = useAuth();
	const token = auth.user?.id_token ?? "";
	const [courses, setCourses] = useState<Course[]>([]);
	const [selected, setSelected] = useState<number | null>(null);
	const [students, setStudents] = useState<Enrollment[]>([]);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [teacherId, setTeacherId] = useState("");
	const [studentEmail, setStudentEmail] = useState("");

	// --- Report Generation State ---
	const [generating, setGenerating] = useState(false);
	const [reportMsg, setReportMsg] = useState("");

	const load = () =>
		api
			.adminListCourses(token)
			.then(setCourses)
			.catch((e) => setError(e.message));

	useEffect(() => {
		if (token) load();
	}, [token]);

	const onCreate = async () => {
		try {
			await api.adminCreateCourse(token, { name, description, teacherId });
			setName("");
			setDescription("");
			setTeacherId("");
			load();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	const onSelect = async (id: number) => {
		setSelected(id);
		setStudents(await api.adminListStudents(token, id));
	};

	const onDelete = async (id: number) => {
		if (!confirm("Delete this course?")) return;
		await api.adminDeleteCourse(token, id);
		if (selected === id) setSelected(null);
		load();
	};

	const onEnroll = async () => {
		if (!selected) return;
		try {
			await api.adminEnrollStudent(token, selected, studentEmail);
			setStudentEmail("");
			setStudents(await api.adminListStudents(token, selected));
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	// --- Report Generation Handler ---
	const onGenerateReport = async () => {
		try {
			setGenerating(true);
			setReportMsg("Generating report...");
			const res = await api.adminGenerateReport(token);
			setReportMsg(`✅ ${res.message} (ID: ${res.reportId}). Check notifications!`);
		} catch (e) {
			setReportMsg(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
		} finally {
			setGenerating(false);
		}
	};

	return (
		<section>
			<h1>Admin · Courses</h1>
			{error && <p className="error">{error}</p>}

			{/* --- REPORT GENERATION UI --- */}
			<div className="card" style={{ marginBottom: "1.5rem", backgroundColor: "#f8f9fa" }}>
				<h3>Analytics & Reports</h3>
				<button 
					onClick={onGenerateReport} 
					disabled={generating}
					style={{ marginTop: "0.5rem" }}
				>
					{generating ? "Generating..." : "Generate Course Report"}
				</button>
				{reportMsg && <p style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>{reportMsg}</p>}
			</div>

			<form
				className="card"
				onSubmit={(e) => {
					e.preventDefault();
					void onCreate();
				}}
			>
				<h3>Create course</h3>
				<input
					placeholder="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<input
					placeholder="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
				<input
					placeholder="Teacher email (Cognito)"
					value={teacherId}
					onChange={(e) => setTeacherId(e.target.value)}
					required
				/>
				<button type="submit">Create</button>
			</form>

			<table className="card">
				<thead>
					<tr>
						<th>ID</th>
						<th>Name</th>
						<th>Teacher</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{courses.map((c) => (
						<tr key={c.id}>
							<td>{c.id}</td>
							<td>{c.name}</td>
							<td>{c.teacher_id}</td>
							<td>
								<button onClick={() => onSelect(c.id)}>Students</button>{" "}
								<button onClick={() => onDelete(c.id)}>Delete</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{selected !== null && (
				<div className="card">
					<h3>Enrolled students of course #{selected}</h3>
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
							<li key={s.id}>{s.student_id}</li>
						))}
					</ul>
				</div>
			)}
		</section>
	);
}