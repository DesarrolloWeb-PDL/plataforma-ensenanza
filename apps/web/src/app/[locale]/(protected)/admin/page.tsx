"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ROLES = ["student", "teacher", "parent", "moderator", "admin"];

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  locale: string;
  createdAt: string;
}

export default function AdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = window.localStorage.getItem("userRole");
    setRole(r);
    if (r !== "admin") return;

    const token = window.localStorage.getItem("accessToken");
    if (!token) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
        const json = (await res.json()) as { data: UserRow[] };
        setUsers(json.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function changeRole(id: string, newRole: string) {
    const token = window.localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("No se pudo cambiar el rol");
      const json = (await res.json()) as { data: { id: string; role: string } };
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: json.data.role } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  if (!role) return <main><p>Cargando...</p></main>;

  if (role !== "admin") {
    return <main><h1>Acceso restringido</h1><p>Solo administradores.</p></main>;
  }

  return (
    <main>
      <h1>Panel de administración</h1>
      <p>Gestioná usuarios, roles y contenido de la plataforma.</p>

      <section>
        <h2>Roles</h2>
        <ul>
          <li><strong>admin</strong> — control total (usuarios, roles, contenido)</li>
          <li><strong>moderator</strong> — modera contenido y usuarios</li>
          <li><strong>teacher</strong> — gestiona sus cursos y alumnos</li>
          <li><strong>parent</strong> — ve progreso de hijos</li>
          <li><strong>student</strong> — accede a los tracks</li>
        </ul>
      </section>

      <section>
        <h2>Usuarios</h2>
        {loading ? <p>Cargando usuarios...</p> : null}
        {error ? <p style={{ color: "#900", fontWeight: 700 }}>{error}</p> : null}
        {users.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !loading && !error ? (
          <p>No hay usuarios.</p>
        ) : null}
      </section>

      <section>
        <h2>Contenido</h2>
        <p>Las herramientas de gestión de contenido (tracks, lecciones, fichas) se construirán en el próximo sprint.</p>
      </section>
    </main>
  );
}