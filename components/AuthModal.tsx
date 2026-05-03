"use client";

import { useState } from "react";
import { login } from "@/lib/auth";

export default function AuthModal({
    onSuccess,
    onClose,
}: {
    onSuccess: () => void;
    onClose: () => void;
}) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleLogin() {
        if (login(password)) {
            onSuccess();
        } else {
            setError("Senha incorreta");
        }
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[320px] rounded-2xl border border-zinc-800 bg-[#070a0e] p-6 shadow-2xl">
                <h2 className="mb-4 text-lg font-black text-white">
                    Acesso restrito
                </h2>

                <input
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mb-3 w-full rounded-md border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-red-500"
                />

                {error && (
                    <p className="mb-3 text-xs text-red-500">{error}</p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleLogin}
                        className="flex-1 rounded-md bg-red-600 py-2 text-xs font-black uppercase hover:bg-red-500"
                    >
                        Entrar
                    </button>

                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border border-zinc-800 py-2 text-xs font-black uppercase text-zinc-400 hover:text-white"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}