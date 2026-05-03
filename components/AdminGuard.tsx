"use client";

import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "admin";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("f1-admin-auth");

    if (saved === "true") {
      setAllowed(true);
    }
  }, []);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("f1-admin-auth", "true");
      setAllowed(true);
      return;
    }

    alert("Senha inválida");
  }

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020407] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#070d13] p-8 shadow-[0_0_40px_rgba(0,0,0,0.65)]">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-red-500">
          Área restrita
        </p>

        <h1 className="text-3xl font-black">Login Admin</h1>

        <p className="mt-2 text-sm text-zinc-400">
          Digite a senha para acessar as configurações.
        </p>

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          className="mt-6 w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
        />

        <button
          onClick={handleLogin}
          className="mt-5 w-full rounded-lg bg-red-600 py-3 text-sm font-black uppercase transition hover:bg-red-500"
        >
          Entrar
        </button>
      </div>
    </main>
  );
}