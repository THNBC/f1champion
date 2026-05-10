"use client";

import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { SlidersHorizontal, Users, Map, AlertTriangle, X, Crown } from "lucide-react";
import { useState } from "react";
import { CirclePlus, PencilLine, Trash } from "lucide-react";

function SettingsCard({
  href,
  icon,
  title,
  description,
  items,
  button,
  className = "",
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  items: { icon: React.ReactNode; label: string }[];
  button: string;
  className?: string;
}) {
  const Icon = icon;

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col rounded-2xl border border-zinc-800 bg-[#080c11] p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)] transition hover:border-red-600/70 hover:bg-[#0b1017] ${className}`}
    >
      <div className="mb-10 flex items-center gap-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center">
          <Icon
            size={70}
            className="text-zinc-500 transition group-hover:scale-110 group-hover:text-red-500 group-hover:drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
          />
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase">{title}</h2>
          <p className="mt-3 text-base text-zinc-400">{description}</p>
        </div>
      </div>

      <div className="space-y-0">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-8 border-b border-zinc-800/80 py-5 text-lg text-zinc-300"
          >
            <span className="flex w-8 items-center justify-center text-zinc-500 transition group-hover:text-red-500 group-hover:scale-110">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-12">
        <div className="flex h-14 items-center justify-center rounded-xl border border-red-600 bg-red-600/10 px-6 text-sm font-black uppercase tracking-wide text-red-500 transition group-hover:bg-red-600 group-hover:text-white">
          {button}
        </div>
      </div>
    </Link>
  );
}

export default function SettingsPage() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
    isLeaving: boolean;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message, isLeaving: false });

    setTimeout(() => {
      setToast((current) => {
        if (!current) return current;
        return { ...current, isLeaving: true };
      });
    }, 2700);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function handleResetChampionship() {
    setResetting(true);

    try {
      await supabase.from("race_awards").delete().neq("race_id", "");
      await supabase.from("race_results").delete().neq("race_id", "");
      await supabase.from("drivers").delete().neq("id", "");

      await supabase
        .from("circuits")
        .update({
          is_finished: false,
          winner: null,
        })
        .neq("id", "");

      setShowResetModal(false);
      showToast("success", "Campeonato resetado com sucesso");

      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (error) {
      console.error("Erro ao resetar campeonato:", error);
      showToast("error", "Erro ao resetar campeonato");
    } finally {
      setResetting(false);
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#020407] px-10 py-10 text-white">
        {toast && (
          <div
            className={`fixed bottom-10 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${toast.isLeaving
              ? "translate-y-4 scale-95 opacity-0 blur-[2px]"
              : "translate-y-0 scale-100 opacity-100 blur-0"
              }`}
          >
            <div
              className={`animate-toast-in rounded-xl border px-6 py-4 shadow-2xl backdrop-blur-md ${toast.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-emerald-950/30"
                : "border-red-500/40 bg-red-500/10 text-red-400 shadow-red-950/30"
                }`}
            >
              <p className="text-center text-xs font-black uppercase tracking-wide">
                {toast.type === "success" ? "Sucesso" : "Erro"}
              </p>

              <p className="mt-1 text-center text-sm font-bold text-white">
                {toast.message}
              </p>
            </div>

            <style jsx>{`
              @keyframes toastIn {
                0% {
                  opacity: 0;
                  transform: translateY(20px) scale(0.95);
                }

                100% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              .animate-toast-in {
                animation: toastIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
              }
            `}</style>
          </div>
        )}

        {showResetModal && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-red-900/60 bg-[#070d13] shadow-[0_0_80px_rgba(0,0,0,0.75)]">
              <div className="flex items-start justify-between border-b border-zinc-800 p-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                    <AlertTriangle size={26} className="text-red-500" />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
                      Zona de perigo
                    </p>

                    <h2 className="mt-2 text-2xl font-black uppercase text-white">
                      Resetar campeonato?
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="rounded-lg border border-zinc-800 p-2 text-zinc-500 transition hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm leading-6 text-zinc-400">
                  Essa ação vai apagar todos os pilotos, resultados e destaques do
                  campeonato. As pistas continuam cadastradas, mas voltam como não
                  finalizadas.
                </p>

                <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/10 p-4">
                  <p className="text-xs font-bold uppercase text-red-400">
                    Essa ação não pode ser desfeita.
                  </p>
                </div>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    onClick={() => setShowResetModal(false)}
                    disabled={resetting}
                    className="rounded-lg border border-zinc-700 px-5 py-3 text-xs font-black uppercase text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleResetChampionship}
                    disabled={resetting}
                    className="rounded-lg bg-red-600 px-6 py-3 text-xs font-black uppercase text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetting ? "Resetando..." : "Confirmar reset"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1500px]">
          <div className="mb-12">
            <p className="mb-6 inline-block border-b-2 border-red-600 pb-2 text-sm font-black uppercase tracking-wide text-red-500">
              Settings
            </p>

            <h1 className="text-5xl font-black tracking-tight">
              Configurações
            </h1>

            <p className="mt-5 text-lg text-zinc-400">
              Gerencie e mantenha todos os dados do campeonato atualizados.
            </p>
          </div>

          <section className="grid grid-cols-1 gap-10 xl:grid-cols-2">
            <SettingsCard
              href="/settings/drivers"
              icon={Users}
              title="Pilotos"
              description="Gerencie os pilotos e suas informações."
              button="Gerenciar pilotos"
              items={[
                { icon: <CirclePlus size={22} />, label: "Adicionar circuito" },
                { icon: <PencilLine size={22} />, label: "Editar circuito" },
                { icon: <Trash size={22} />, label: "Remover circuito" },
              ]}
            />

            <SettingsCard
              href="/settings/circuits"
              icon={Map}
              title="Circuitos"
              description="Gerencie os circuitos e suas informações."
              button="Gerenciar circuitos"
              items={[
                { icon: <CirclePlus size={22} />, label: "Adicionar circuito" },
                { icon: <PencilLine size={22} />, label: "Editar circuito" },
                { icon: <Trash size={22} />, label: "Remover circuito" },
              ]}
            />
            <SettingsCard
              href="/settings/champions"
              icon={Crown}
              title="Campeões"
              description="Gerencie os campeões de cada temporada."
              button="Gerenciar campeões"
              items={[
                { icon: <CirclePlus size={22} />, label: "Adicionar campeão" },
                { icon: <PencilLine size={22} />, label: "Editar campeão" },
                { icon: <Trash size={22} />, label: "Remover campeão" },
              ]}
            />
            <SettingsCard
              href="/settings/lobby"
              icon={SlidersHorizontal}

              title="Lobby Config."
              description="Configure regras, assistências e simulação do lobby."
              button="Configurar lobby"
              items={[
                { icon: "›", label: "Opções do lobby e IA" },
                { icon: "›", label: "Restrições de assistência" },
                { icon: "›", label: "Fim de semana e clima" },
                { icon: "›", label: "Regras e bandeiras" },
                { icon: "›", label: "Simulação e colisões" },
              ]}
            />
          </section>

          <section className="mt-10 rounded-2xl border border-red-900/50 bg-red-950/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>

                <div>
                  <h2 className="text-2xl font-black uppercase text-red-500">
                    Zona de perigo
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                    Apaga pilotos, resultados e destaques do campeonato. As pistas
                    continuam cadastradas, mas voltam como não finalizadas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowResetModal(true)}
                className="rounded-lg border border-red-600 bg-red-600/10 px-7 py-4 text-sm font-black uppercase tracking-wide text-red-500 transition hover:bg-red-600 hover:text-white"
              >
                Resetar campeonato
              </button>
            </div>

          </section>
        </div>
      </main>
    </AdminGuard>
  );
}