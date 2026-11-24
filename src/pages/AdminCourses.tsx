import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Course, Enrollment, Payment } from "../types";

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

	const [generating, setGenerating] = useState(false);
	const [reportMsg, setReportMsg] = useState("");
	const [payments, setPayments] = useState<Payment[]>([]);

	const load = () =>
		api.adminListCourses(token).then(setCourses).catch((e) => setError(e.message));
		api.adminListPayments(token).then(setPayments).catch(() => {});

	useEffect(() => {
		if (token) load();
	}, [token]);

	const onCreate = async () => {
		try {
			await api.adminCreateCourse(token, { name, description, teacherId });
			setName("");
			setDescription("");
			setTeacherId("");
			setTimeout(() => load(), 1500); 
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
		try {
			await api.adminDeleteCourse(token, id);
			if (selected === id) setSelected(null);
			setTimeout(() => load(), 1500);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			load(); // If it fails, reload the true state to bring it back
		}
	};

	const onEnroll = async () => {
		if (!selected) return;
		try {
			await api.adminEnrollStudent(token, selected, studentEmail);
			setStudentEmail("");
			setTimeout(async () => {
				setStudents(await api.adminListStudents(token, selected));
			}, 1500);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	// --- Report Generation Handler ---
	const onGenerateReport = async () => {
		try {
			setGenerating(true);
			setReportMsg("Generating report...");
			await api.adminGenerateReport(token);
			setReportMsg(`✅ Report generation initiated! Check notifications in a few seconds.`);
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
			<div className="card" style={{ marginBottom: "1.5rem" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<h3 style={{ margin: 0 }}>💸 Recent payments (Kafka stream)</h3>
					<div>
						<button onClick={() => load()} style={{ marginRight: "0.5rem" }}>
							Refresh
						</button>
						<button onClick={onGenerateReport} disabled={generating}>
							{generating ? "Generating…" : "Generate Report"}
						</button>
					</div>
				</div>
				{reportMsg && <p style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>{reportMsg}</p>}

				<table style={{ marginTop: "0.75rem" }}>
					<thead>
						<tr>
							<th>Payment</th>
							<th>Student</th>
							<th>Course</th>
							<th>Amount</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => (
							<tr key={p.id}>
								<td><code>{p.id.slice(0, 8)}…</code></td>
								<td>{p.student_id}</td>
								<td>{p.course_name}</td>
								<td>{(p.amount_cents / 100).toFixed(2)} {p.currency}</td>
								<td>{p.status}</td>
							</tr>
						))}
						{payments.length === 0 && (
							<tr><td colSpan={5} className="muted">No payments yet.</td></tr>
						)}
					</tbody>
				</table>
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