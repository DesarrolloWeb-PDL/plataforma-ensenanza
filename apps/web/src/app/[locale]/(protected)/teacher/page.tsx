"use client";

import { useEffect, useState } from "react";

export default function TeacherPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = window.localStorage.getItem("userRole");
    setRole(r);
  }, []);

  if (!role) return <main><p>Cargando...</p></main>;

  if (role !== "teacher" && role !== "admin") {
    return <main><h1>Acceso restringido</h1><p>Solo docentes y administradores.</p></main>;
  }

  return (
    <main>
      <h1>Panel docente</h1>
      <p>Gestioná recursos, tareas y alumnos.</p>
      <section>
        <h2>Acciones</h2>
        <ul>
          <li>Agregar recursos y fichas</li>
          <li>Crear tareas y calificar</li>
          <li>Ver alumnos y progreso</li>
          <li>Organizar clases</li>
        </ul>
      </section>
      <section>
        <h2>Próximamente</h2>
        <p>Las herramientas docentes se están construyendo.</p>
      </section>
    </main>
  );
}