"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown,
  PencilLine,
  Trash,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminGuard from "@/components/AdminGuard";

type Team = {
  id: string;
  name: string;
  logo: string | null;
  color: string | null;
};

type Champion = {
  id: number;
  season: number | null;
  year: number | null;
  driver_name: string | null;
  team_name: string | null;
  team_id: string | null;
};

export default function SettingsChampionsPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [season, setSeason] = useState("");
  const [year, setYear] = useState("");
  const [driverName, setDriverName] = useState("");
  const [teamId, setTeamId] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
    isLeaving: boolean;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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

  async function loadData() {
    setLoading(true);

    const [championsRes, teamsRes] = await Promise.all([
      supabase
        .from("champions")
        .select(
          "id, season, year, driver_name, team_name, team_id"
        )
        .order("season", { ascending: true }),

      supabase
        .from("teams")
        .select("id, name, logo, color")
        .order("name", { ascending: true }),
    ]);

    if (championsRes.error) {
      console.error(
        "Erro ao carregar campeões:",
        championsRes.error
      );

      showToast("error", "Erro ao carregar campeões");
      setLoading(false);
      return;
    }

    if (teamsRes.error) {
      console.error(
        "Erro ao carregar equipes:",
        teamsRes.error
      );

      showToast("error", "Erro ao carregar equipes");
      setLoading(false);
      return;
    }

    setChampions((championsRes.data || []) as Champion[]);
    setTeams((teamsRes.data || []) as Team[]);
    setLoading(false);
  }

  function resetForm() {
    setSeason("");
    setYear("");
    setDriverName("");
    setTeamId("");
    setEditingId(null);
  }

  async function handleSave() {
    if (!season || !year || !driverName || !teamId) {
      showToast(
        "error",
        "Preencha temporada, ano, piloto e equipe"
      );

      return;
    }

    const selectedTeam = teams.find(
      (team) => team.id === teamId
    );

    if (!selectedTeam) {
      showToast("error", "Equipe inválida");
      return;
    }

    setSaving(true);

    const payload = {
      season: Number(season),
      year: Number(year),
      driver_name: driverName.trim(),
      team_name: selectedTeam.name,
      team_id: teamId,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("champions")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error(
          "Erro ao editar campeão:",
          error
        );

        showToast("error", "Erro ao editar campeão");
        setSaving(false);
        return;
      }

      showToast(
        "success",
        "Campeão atualizado com sucesso"
      );
    } else {
      const { error } = await supabase
        .from("champions")
        .insert([payload]);

      if (error) {
        console.error(
          "Erro ao adicionar campeão:",
          error
        );

        showToast(
          "error",
          "Erro ao adicionar campeão"
        );

        setSaving(false);
        return;
      }

      showToast(
        "success",
        "Campeão adicionado com sucesso"
      );
    }

    resetForm();
    setEditingId(null);

    await loadData();

    setSaving(false);
  }

  function handleEdit(champion: Champion) {
    setEditingId(champion.id);

    setSeason(String(champion.season ?? ""));
    setYear(String(champion.year ?? ""));
    setDriverName(champion.driver_name ?? "");
    setTeamId(champion.team_id ?? "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id: number) {
    const confirmDelete = confirm(
      "Tem certeza que deseja remover este campeão?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("champions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Erro ao remover campeão:",
        error
      );

      showToast(
        "error",
        "Erro ao remover campeão"
      );

      return;
    }

    showToast(
      "success",
      "Campeão removido com sucesso"
    );

    await loadData();
  }

  function getTeamLogo(teamIdValue: string | null) {
    const team = teams.find(
      (item) => item.id === teamIdValue
    );

    if (!team?.logo) {
      return "/logos/default.png";
    }

    if (team.logo.startsWith("/")) {
      return team.logo;
    }

    return `/logos/${team.logo}`;
  }

  function getTeamColor(teamIdValue: string | null) {
    const team = teams.find(
      (item) => item.id === teamIdValue
    );

    return team?.color || "#27272a";
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#05070a] p-8 text-white">
        {toast && (
          <div
            className={`fixed bottom-10 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300 ${toast.isLeaving
                ? "translate-y-4 scale-95 opacity-0 blur-[2px]"
                : "translate-y-0 scale-100 opacity-100 blur-0"
              }`}
          >
            <div
              className={`rounded-xl border px-6 py-4 shadow-2xl backdrop-blur-md ${toast.type === "success"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
                }`}
            >
              <p className="text-center text-xs font-black uppercase tracking-wide">
                {toast.type === "success"
                  ? "Sucesso"
                  : "Erro"}
              </p>

              <p className="mt-1 text-center text-sm font-bold text-white">
                {toast.message}
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1500px]">
          {/* TOPO */}
          <div className="mb-10">
            {/* BREADCRUMB */}
            <div className="mb-8 flex items-center justify-between gap-6">
              <div className="flex items-center gap-3 text-sm font-black uppercase tracking-wide">
                <Link
                  href="/settings"
                  className="text-zinc-500 transition hover:text-red-400"
                >
                  Settings
                </Link>

                <span className="text-zinc-700">›</span>

                <span>
                  Champions
                </span>
              </div>

              <Link
                href="/settings"
                className="rounded-lg border border-red-600 px-5 py-3 text-xs font-black uppercase text-red-500 transition hover:bg-red-600 hover:text-white"
              >
                ← Voltar
              </Link>
            </div>

            {/* HEADER */}
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-5xl font-black tracking-tight">
                  Campeões
                </h1>

                <p className="mt-5 text-lg text-zinc-400">
                  Adicione, edite ou remova os campeões de
                  cada temporada.
                </p>
              </div>

              <Crown className="hidden h-24 w-24 text-yellow-400 lg:block" />
            </div>
          </div>

          {/* FORM */}
          <section className="mb-10 rounded-2xl border border-zinc-800 bg-[#080c11] p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
                  <Plus
                    className="text-red-500"
                    size={30}
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black uppercase">
                    {editingId
                      ? "Editar campeão"
                      : "Adicionar campeão"}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    Preencha temporada, ano, piloto e
                    equipe.
                  </p>
                </div>
              </div>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 transition hover:border-red-500 hover:text-red-400"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">
                  Temporada
                </label>

                <input
                  type="number"
                  value={season}
                  onChange={(e) =>
                    setSeason(e.target.value)
                  }
                  placeholder="Ex: 1"
                  className="h-14 w-full rounded-xl border border-zinc-800 bg-[#05070a] px-4 text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">
                  Ano
                </label>

                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value)
                  }
                  placeholder="Ex: 2025"
                  className="h-14 w-full rounded-xl border border-zinc-800 bg-[#05070a] px-4 text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">
                  Piloto
                </label>

                <input
                  type="text"
                  value={driverName}
                  onChange={(e) =>
                    setDriverName(e.target.value)
                  }
                  placeholder="Nome do piloto"
                  className="h-14 w-full rounded-xl border border-zinc-800 bg-[#05070a] px-4 text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">
                  Equipe
                </label>

                <select
                  value={teamId}
                  onChange={(e) =>
                    setTeamId(e.target.value)
                  }
                  className="h-14 w-full rounded-xl border border-zinc-800 bg-[#05070a] px-4 text-white outline-none transition focus:border-red-500"
                >
                  <option value="">
                    Selecione a equipe
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-14 items-center justify-center rounded-xl bg-red-600 px-8 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Adicionar campeão"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="flex h-14 items-center justify-center rounded-xl border border-zinc-700 px-8 text-sm font-black uppercase tracking-wide text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </section>

          {/* TABELA */}
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#080c11] shadow-[0_0_50px_rgba(0,0,0,0.35)]">
            <div className="grid grid-cols-[160px_160px_1fr_1fr_160px] border-b border-zinc-800 bg-black/20 px-6 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">
              <div>Temporada</div>
              <div>Ano</div>
              <div>Piloto</div>
              <div>Equipe</div>
              <div className="text-right">
                Ações
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-zinc-400">
                Carregando campeões...
              </div>
            ) : champions.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                Nenhum campeão cadastrado.
              </div>
            ) : (
              champions.map((champion) => {
                const teamColor = getTeamColor(
                  champion.team_id
                );

                return (
                  <div
                    key={champion.id}
                    style={{
                      borderColor: `${teamColor}30`,
                    }}
                    className="grid grid-cols-[160px_160px_1fr_1fr_160px] items-center border-b border-zinc-800/70 px-6 py-5 transition-all duration-300 hover:bg-white/[0.02]"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        teamColor;

                      e.currentTarget.style.boxShadow = `0 0 30px ${teamColor}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        `${teamColor}30`;

                      e.currentTarget.style.boxShadow =
                        "none";
                    }}
                  >
                    <div className="text-2xl font-black">
                      {champion.season}ª
                    </div>

                    <div className="text-2xl font-black">
                      {champion.year}
                    </div>

                    <div className="font-bold text-zinc-200">
                      {champion.driver_name ||
                        "Piloto não informado"}
                    </div>

                    <div className="flex items-center gap-4 font-medium text-zinc-300">
                      <img
                        src={getTeamLogo(
                          champion.team_id
                        )}
                        alt={
                          champion.team_name ||
                          "Equipe"
                        }
                        className="h-8 w-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/logos/default.png";
                        }}
                      />

                      <span>
                        {champion.team_name ||
                          "Equipe não informada"}
                      </span>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          handleEdit(champion)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition hover:border-red-500 hover:text-red-400"
                      >
                        <PencilLine size={18} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(champion.id)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-900/60 text-red-500 transition hover:bg-red-600 hover:text-white"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}