import AssignmentSubmissionForm from "@/components/AssignmentSubmissionForm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Assignment {
  id: string;
  title: string;
  instructionsMd: string;
  type: string;
  dueAt: string | null;
  maxScore: number;
}

async function fetchAssignment(id: string): Promise<Assignment | null> {
  const res = await fetch(`${API_BASE}/api/v1/assignments/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Assignment };
  return json.data;
}

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const assignment = await fetchAssignment(params.id);
  if (!assignment) {
    return <main><h1>Tarea no encontrada</h1></main>;
  }
  return (
    <main>
      <h1>{assignment.title}</h1>
      <p>{assignment.instructionsMd}</p>
      <p>Tipo: {assignment.type}</p>
      <p>Puntaje máximo: {assignment.maxScore}</p>
      {assignment.dueAt ? <p>Entrega: {assignment.dueAt}</p> : null}
      <AssignmentSubmissionForm assignmentId={assignment.id} type={assignment.type} />
    </main>
  );
}