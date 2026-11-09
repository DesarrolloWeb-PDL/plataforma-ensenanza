"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = window.localStorage.getItem("userRole");
    setRole(r);
  }, []);

  if (!role) return <main><p>Cargando...</p></main>;

  if (role !== "admin") {
    return <main><h1>Acceso restringido</h1><p>Solo administradores.</p></main>;
  }

  return (
    <main>
      <h1>Panel de administración</h1>
      <p>Gestioná contenido, usuarios y configuración.</p>
      <section>
        <h2>Acciones</h2>
        <ul>
          <li>Agregar tracks y niveles</li>
          <li>Agregar lecciones (MDX)</li>
          <li>Administrar usuarios</li>
          <li>Ver estadísticas completas</li>
        </ul>
      </section>
      <section>
        <h2>Próximamente</h2>
        <p>Las herramientas de administración se están construyendo.</p>
      </section>
    </main>
  );
}