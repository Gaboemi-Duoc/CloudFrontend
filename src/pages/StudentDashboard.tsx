import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Course, Payment, Task } from "../types";

export default function StudentDashboard() {
	const auth = useAuth();
	const token = auth.user?.id_token ?? "";
	const [mine, setMine] = useState<Course[]>([]);
	const [available, setAvailable] = useState<Course[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [payments, setPayments] = useState<Payment[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Payment flow state
	const [activePayment, setActivePayment] = useState<Payment | null>(null);
	const [payingCourseId, setPayingCourseId] = useState<number | null>(null);

	const reload = async () => {
		try {
			const [m, a, t, p] = await Promise.all([
				api.studentMyCourses(token),
				api.studentAvailableCourses(token),
				api.studentAllTasks(token),
				api.studentMyPayments(token),
			]);
			setMine(m);
			setAvailable(a);
			setTasks(t);
			setPayments(p);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	useEffect(() => {
		if (token) void reload();
	}, [token]);

	const enrollFree = async (id: number) => {
		try {
			await api.studentEnroll(token, id);
			await reload();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		}
	};

	const payAndEnroll = async (course: Course) => {
		setPayingCourseId(course.id);
		setError(null);
		try {
			// 1. Kick off payment — Lambda produces payment.initiated to Kafka
			const initial = await api.studentPayForCourse(token, course.id);
			setActivePayment(initial);

			// 2. Poll until the Kafka consumers settle the state
			let current = initial;
			for (let i = 0; i < 15; i++) {
				await new Promise((r) => setTimeout(r, 1000));
				current = await api.studentGetPayment(token, initial.id);
				setActivePayment(current);
				if (current.status === "completed" || current.status === "failed")
					break;
			}

			if (current.status === "failed") {
				setError(current.failure_reason ?? "Payment failed");
			} else if (current.status === "completed") {
				// Enrollment is now visible
				await reload();
			}
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setPayingCourseId(null);
			setActivePayment(null);
		}
	};

	return (
		<section>
			<h1>Student dashboard</h1>
			{error && <p className="error">{error}</p>}

			{activePayment && (
				<div className="card" style={{ borderLeft: "4px solid #2563eb" }}>
					<h3>💳 Processing payment…</h3>
					<p>
						Course: <b>{activePayment.course_name}</b> ·{" "}
						{(activePayment.amount_cents / 100).toFixed(2)}{" "}
						{activePayment.currency}
					</p>
					<p>
						Kafka status:{" "}
						<code>{activePayment.status}</code>
					</p>
				</div>
			)}

			<div className="card">
				<h3>My courses</h3>
				<ul>
					{mine.map((c) => (
						<li key={c.id}>
							#{c.id} — {c.name}{" "}
							<span className="muted">({c.teacher_id})</span>
						</li>
					))}
					{mine.length === 0 && <li>Not enrolled in any course yet.</li>}
				</ul>
			</div>

			<div className="card">
				<h3>Available courses</h3>
				<ul>
					{available.map((c) => {
						const price = (c.price_cents ?? 0) / 100;
						const isPaying = payingCourseId === c.id;
						return (
							<li key={c.id}>
								#{c.id} — {c.name}{" "}
								<span className="muted">
									{price > 0 ? `$${price.toFixed(2)}` : "Free"}
								</span>{" "}
								<button
									disabled={isPaying || payingCourseId !== null}
									onClick={() =>
										price > 0 ? void payAndEnroll(c) : void enrollFree(c.id)
									}
								>
									{isPaying
										? "Paying…"
										: price > 0
											? "Buy & Enroll"
											: "Enroll"}
								</button>
							</li>
						);
					})}
					{available.length === 0 && <li>No courses available.</li>}
				</ul>
			</div>

			<div className="card">
				<h3>Payment history</h3>
				<table>
					<thead>
						<tr>
							<th>Payment</th>
							<th>Course</th>
							<th>Amount</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => (
							<tr key={p.id}>
								<td>
									<code>{p.id.slice(0, 8)}…</code>
								</td>
								<td>{p.course_name}</td>
								<td>
									{(p.amount_cents / 100).toFixed(2)} {p.currency}
								</td>
								<td>
									<span
										className={
											p.status === "completed"
												? "ok"
												: p.status === "failed"
													? "error"
													: "muted"
										}
									>
										{p.status}
									</span>
								</td>
							</tr>
						))}
						{payments.length === 0 && (
							<tr>
								<td colSpan={4} className="muted">
									No payments yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="card">
				<h3>My tasks</h3>
				<ul>
					{tasks.map((t) => (
						<li key={t.id}>
							<b>{t.title}</b> (course #{t.course_id})
							{t.due_date ? ` — due ${t.due_date}` : ""}
							{t.description && <div className="muted">{t.description}</div>}
						</li>
					))}
					{tasks.length === 0 && <li>No tasks assigned.</li>}
				</ul>
			</div>
		</section>
	);
}