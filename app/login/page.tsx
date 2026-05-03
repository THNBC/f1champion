"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      router.push("/settings");
    } else {
      alert("Email ou senha inválidos");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020407] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#070d13] p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-red-500">
          Área restrita
        </p>

        <h1 className="text-3xl font-black">Login Admin</h1>

        <p className="mt-2 text-sm text-zinc-400">
          Acesso necessário para configurações do sistema.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-6 w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-lg border border-zinc-700 bg-black/40 px-4 py-3 outline-none focus:border-red-500"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-red-600 py-3 text-sm font-black uppercase transition hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
}