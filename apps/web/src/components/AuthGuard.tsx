"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/auth";
      return;
    }
    setAuthed(true);
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!authed) return null;
  return <>{children}</>;
}